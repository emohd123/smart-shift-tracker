import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Loader2, AlertCircle, Crown, Users, Search, Sparkles, CheckCircle2, ArrowLeft, Clock, MapPin, Building2, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MultiCompanyCertificatePreview, { CompanyWorkEntry } from "../promoter/MultiCompanyCertificatePreview";
import { MultiCompanyCertificate } from "../types/certificate";
import { generateMultiCompanyPDF } from "../utils/multiCompanyPdfGenerator";
import { uploadFileToBucket } from "@/integrations/supabase/storage";
import CertificateDateFilter from "../promoter/CertificateDateFilter";
import { buildBdfCertificateDataFromMultiCompany } from "../utils/bdfCertificateData";

interface PromoterOption {
  id: string;
  full_name: string;
  unique_code: string;
  profile_photo_url?: string;
  total_shifts?: number;
  total_hours?: number;
  age?: number | null;
  nationality?: string | null;
  phone_number?: string | null;
  email?: string | null;
}

interface ShiftEntry {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  company_name: string;
  company_id: string;
  company_logo_url?: string | null;
  company_registration_number?: string | null;
  company_phone_number?: string | null;
  company_email?: string | null;
  total_hours: number;
  status: string;
}

export default function AdminCertificatesPage() {
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterOption | null>(null);
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPromoters();
  }, []);

  useEffect(() => {
    if (selectedPromoter) {
      fetchPromoterShifts(selectedPromoter.id);
    } else {
      setShifts([]);
      setSelectedShifts(new Set());
    }
  }, [selectedPromoter]);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      
      // Fetch promoter roles
      const { data: promoterRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'promoter');

      if (rolesError) throw rolesError;

      if (!promoterRoles || promoterRoles.length === 0) {
        setPromoters([]);
        setLoading(false);
        return;
      }

      const promoterIds = promoterRoles.map(r => r.user_id);

      // Fetch profiles for these promoters
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, unique_code, profile_photo_url, age, nationality, phone_number, email')
        .in('id', promoterIds)
        .order('full_name');

      if (error) throw error;

      const promoterList: PromoterOption[] = [];
      
      for (const p of data || []) {
        const { data: timeLogs, error: timeError } = await supabase
          .from('time_logs')
          .select('shift_id, total_hours')
          .eq('user_id', p.id);
        
        if (timeError) {
          console.error('Error fetching time logs for', p.id, timeError);
        }
        
        const uniqueShiftIds = new Set(timeLogs?.map(log => log.shift_id).filter(Boolean) || []);
        const shiftCount = uniqueShiftIds.size;
        const totalHours = timeLogs?.reduce((sum, log) => sum + (log.total_hours || 0), 0) || 0;

        promoterList.push({
          id: p.id,
          full_name: p.full_name || 'Unknown',
          unique_code: p.unique_code || '',
          profile_photo_url: p.profile_photo_url,
          total_shifts: shiftCount,
          total_hours: totalHours,
          age: p.age,
          nationality: p.nationality,
          phone_number: p.phone_number,
          email: p.email
        });
      }

      setPromoters(promoterList);
    } catch (error) {
      console.error('Error fetching promoters:', error);
      toast.error('Failed to load promoters');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoterShifts = async (promoterId: string) => {
    try {
      setLoadingShifts(true);

      const { data: timeLogs, error: timeLogsError } = await supabase
        .from('time_logs')
        .select('shift_id, total_hours, check_in_time, check_out_time')
        .eq('user_id', promoterId);

      if (timeLogsError) throw timeLogsError;

      if (!timeLogs || timeLogs.length === 0) {
        setShifts([]);
        setLoadingShifts(false);
        return;
      }

      const shiftIds = [...new Set(timeLogs.map(t => t.shift_id).filter(Boolean))];

      if (shiftIds.length === 0) {
        setShifts([]);
        setLoadingShifts(false);
        return;
      }

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, title, date, start_time, end_time, location, company_id, status')
        .in('id', shiftIds)
        .order('date', { ascending: false });

      if (shiftsError) throw shiftsError;

      // Get company details including logo, registration, phone, email
      const companyIds = [...new Set(shiftsData?.map(s => s.company_id).filter(Boolean) || [])];
      
      let companyMap = new Map<string, { 
        name: string; 
        logo_url: string | null; 
        registration_number: string | null;
        phone_number: string | null;
        email: string | null;
      }>();
      
      if (companyIds.length > 0) {
        // Get company_profiles for name, logo, registration
        const { data: companies } = await supabase
          .from('company_profiles')
          .select('user_id, name, logo_url, registration_id')
          .in('user_id', companyIds);

        // Get profiles for phone and email
        const { data: companyUsers } = await supabase
          .from('profiles')
          .select('id, phone_number, email')
          .in('id', companyIds);

        const companyUserMap = new Map(companyUsers?.map(u => [u.id, u]) || []);

        companies?.forEach(c => {
          const userProfile = companyUserMap.get(c.user_id);
          companyMap.set(c.user_id, {
            name: c.name,
            logo_url: c.logo_url,
            registration_number: c.registration_id || null,
            phone_number: userProfile?.phone_number || null,
            email: userProfile?.email || null
          });
        });
      }

      const timeLogMap = new Map<string, number>();
      timeLogs.forEach(log => {
        if (log.shift_id) {
          const current = timeLogMap.get(log.shift_id) || 0;
          timeLogMap.set(log.shift_id, current + (log.total_hours || 0));
        }
      });

      const { data: assignments } = await supabase
        .from('shift_assignments')
        .select('shift_id, status')
        .eq('promoter_id', promoterId)
        .in('shift_id', shiftIds);

      const assignmentStatusMap = new Map(assignments?.map(a => [a.shift_id, a.status]) || []);

      const shiftEntries: ShiftEntry[] = shiftsData?.map(s => {
        const assignmentStatus = assignmentStatusMap.get(s.id);
        const hoursWorked = timeLogMap.get(s.id) || 0;
        const companyInfo = companyMap.get(s.company_id);

        return {
          id: s.id,
          title: s.title || 'Untitled Shift',
          date: s.date,
          start_time: s.start_time || '00:00',
          end_time: s.end_time || '00:00',
          location: s.location || 'N/A',
          company_name: companyInfo?.name || 'Unknown Company',
          company_id: s.company_id,
          company_logo_url: companyInfo?.logo_url || null,
          company_registration_number: companyInfo?.registration_number || null,
          company_phone_number: companyInfo?.phone_number || null,
          company_email: companyInfo?.email || null,
          total_hours: hoursWorked,
          status: assignmentStatus || s.status || 'completed'
        };
      }) || [];

      setShifts(shiftEntries);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoadingShifts(false);
    }
  };

  const getFilteredShifts = () => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      if (dateFrom && shiftDate < dateFrom) return false;
      if (dateTo && shiftDate > dateTo) return false;
      return true;
    });
  };

  const toggleShiftSelection = (shiftId: string) => {
    const newSelected = new Set(selectedShifts);
    if (newSelected.has(shiftId)) {
      newSelected.delete(shiftId);
    } else {
      newSelected.add(shiftId);
    }
    setSelectedShifts(newSelected);
  };

  const selectAllFilteredShifts = () => {
    const filtered = getFilteredShifts();
    const newSelected = new Set(filtered.map(s => s.id));
    setSelectedShifts(newSelected);
  };

  const clearSelection = () => {
    setSelectedShifts(new Set());
  };

  const getSelectedShiftsData = (): CompanyWorkEntry[] => {
    const selectedShiftsList = shifts.filter(s => selectedShifts.has(s.id));
    const companyMap = new Map<string, CompanyWorkEntry>();

    selectedShiftsList.forEach(shift => {
      if (!companyMap.has(shift.company_id)) {
        companyMap.set(shift.company_id, {
          company: {
            id: shift.company_id,
            name: shift.company_name,
            logo_url: shift.company_logo_url || null,
            website: null,
            registration_number: shift.company_registration_number || null,
            phone_number: shift.company_phone_number || null,
            email: shift.company_email || null,
            contact_person: null
          },
          shifts: [],
          totalHours: 0
        });
      }

      const entry = companyMap.get(shift.company_id)!;
      entry.shifts.push({
        id: shift.id,
        title: shift.title,
        dateFrom: shift.date,
        dateTo: shift.date,
        timeFrom: shift.start_time,
        timeTo: shift.end_time,
        totalHours: shift.total_hours,
        location: shift.location,
        approvedAt: new Date().toISOString()
      });
      entry.totalHours += shift.total_hours;
    });

    return Array.from(companyMap.values());
  };

  const handleGenerateCertificate = async () => {
    if (!selectedPromoter || selectedShifts.size === 0) {
      toast.error('Please select at least one shift');
      return;
    }

    setGenerating(true);
    const loadingToast = toast.loading('Generating certificate PDF...');

    try {
      const workEntries = getSelectedShiftsData();
      const grandTotalHours = workEntries.reduce((sum, c) => sum + c.totalHours, 0);
      const referenceNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const certData: MultiCompanyCertificate = {
        referenceNumber,
        promoterName: selectedPromoter.full_name,
        issueDate: new Date().toISOString(),
        companies: workEntries,
        grandTotalHours,
        promoter: {
          id: selectedPromoter.id,
          full_name: selectedPromoter.full_name,
          age: selectedPromoter.age,
          nationality: selectedPromoter.nationality,
          phone_number: selectedPromoter.phone_number,
          email: selectedPromoter.email,
          profile_photo_url: selectedPromoter.profile_photo_url,
          unique_code: selectedPromoter.unique_code
        }
      };

      const bdfData = buildBdfCertificateDataFromMultiCompany(certData);

      const pdfBlob = await generateMultiCompanyPDF(certData);
      
      // Trigger immediate download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `Certificate-${selectedPromoter.full_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
      
      // Try to upload to storage
      let pdfUrl = null;
      try {
        const pdfFile = new File([pdfBlob], `certificate-${referenceNumber}.pdf`, { type: 'application/pdf' });
        const pdfPath = `certificates/${selectedPromoter.id}/${referenceNumber}.pdf`;
        const uploadResult = await uploadFileToBucket(pdfFile, 'certificates', pdfPath);
        if (uploadResult.success) {
          pdfUrl = uploadResult.data;
        }
      } catch (uploadError) {
        console.warn('Failed to upload certificate to storage:', uploadError);
      }

      // Save certificate record
      const { error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: selectedPromoter.id,
          reference_number: referenceNumber,
          certificate_type: 'work_experience',
          issue_date: new Date().toISOString(),
          total_hours: grandTotalHours,
          status: 'active',
          paid: true,
          pdf_url: pdfUrl,
          time_period: JSON.stringify({
            promoterName: selectedPromoter.full_name,
            companies: workEntries,
            generatedByAdmin: true,
            selectedShiftIds: Array.from(selectedShifts),
            bdf: bdfData
          })
        });

      if (certError) {
        console.warn('Failed to save certificate record:', certError);
      }

      toast.dismiss(loadingToast);
      toast.success('Certificate PDF downloaded successfully!');
      
      setSelectedShifts(new Set());
      setShowPreview(false);
      
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error generating certificate:', error);
      toast.error(error.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const filteredPromoters = promoters.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unique_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShifts = getFilteredShifts();
  const selectedTotalHours = shifts
    .filter(s => selectedShifts.has(s.id))
    .reduce((sum, s) => sum + s.total_hours, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (showPreview && selectedPromoter && selectedShifts.size > 0) {
    const workEntries = getSelectedShiftsData();
    const grandTotalHours = workEntries.reduce((sum, c) => sum + c.totalHours, 0);

    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setShowPreview(false)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>

        <Card className="border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Certificate Preview
                </CardTitle>
                <CardDescription>
                  For {selectedPromoter.full_name} • {selectedShifts.size} shifts • {grandTotalHours.toFixed(1)} hours
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                FREE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MultiCompanyCertificatePreview 
              data={{
                referenceNumber: 'PREVIEW',
                promoterName: selectedPromoter.full_name,
                issueDate: new Date().toISOString(),
                companies: workEntries,
                grandTotalHours
              }} 
            />
            <div className="mt-6 flex justify-center gap-4">
              <Button 
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Back to Edit
              </Button>
              <Button 
                onClick={handleGenerateCertificate}
                disabled={generating}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Generate Free Certificate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedPromoter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedPromoter(null);
              setSelectedShifts(new Set());
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Promoters
          </Button>
          
          {selectedShifts.size > 0 && (
            <Button 
              onClick={() => setShowPreview(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Award className="h-4 w-4 mr-2" />
              Generate Certificate ({selectedShifts.size} shifts)
            </Button>
          )}
        </div>

        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-amber-500/30">
                <AvatarImage src={selectedPromoter.profile_photo_url} />
                <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xl">
                  {selectedPromoter.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedPromoter.full_name}</h2>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                  <Badge variant="outline">{selectedPromoter.unique_code}</Badge>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {shifts.length} shifts
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedPromoter.total_hours?.toFixed(1) || 0} hours
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <CertificateDateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={() => {
            setDateFrom(null);
            setDateTo(null);
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectAllFilteredShifts}
            >
              Select All ({filteredShifts.length})
            </Button>
            {selectedShifts.size > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            )}
          </div>
          {selectedShifts.size > 0 && (
            <Badge variant="secondary" className="text-sm">
              {selectedShifts.size} selected • {selectedTotalHours.toFixed(1)} hours
            </Badge>
          )}
        </div>

        {loadingShifts ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : filteredShifts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Shifts Found</h3>
              <p className="text-sm text-muted-foreground">
                {shifts.length === 0 
                  ? 'This promoter has no shift history yet.'
                  : 'No shifts match your date filter. Try adjusting the dates.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredShifts.map((shift) => (
                <Card 
                  key={shift.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedShifts.has(shift.id) 
                      ? 'border-2 border-amber-500 bg-amber-500/5' 
                      : 'hover:border-primary/30'
                  }`}
                  onClick={() => toggleShiftSelection(shift.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedShifts.has(shift.id) 
                          ? 'bg-amber-500 border-amber-500' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {selectedShifts.has(shift.id) && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-semibold truncate">{shift.title}</h4>
                          <Badge variant={shift.status === 'completed' ? 'default' : 'secondary'}>
                            {shift.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(shift.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {shift.start_time} - {shift.end_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {shift.company_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {shift.location}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5">
                            <Clock className="h-3 w-3 mr-1" />
                            {shift.total_hours.toFixed(1)} hours
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search promoters by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPromoters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Promoters Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try a different search term' : 'No promoters registered yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromoters.map((promoter) => (
            <Card 
              key={promoter.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-amber-500/50 group"
              onClick={() => setSelectedPromoter(promoter)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border group-hover:border-amber-500/50 transition-colors">
                    <AvatarImage src={promoter.profile_photo_url} />
                    <AvatarFallback className="bg-primary/10">
                      {promoter.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-amber-600 transition-colors">
                      {promoter.full_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {promoter.unique_code}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {promoter.total_shifts} shifts
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {promoter.total_hours?.toFixed(1) || 0}h
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator className="my-6" />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>SmartShift Tracker © 2025 — All rights reserved</p>
      </div>
    </div>
  );
}
