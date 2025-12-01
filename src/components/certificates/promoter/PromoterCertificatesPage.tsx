import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import MultiCompanyCertificatePreview, { CompanyWorkEntry } from "./MultiCompanyCertificatePreview";
import { MultiCompanyCertificate } from "../types/certificate";
import MyCertificates from "../MyCertificates";
import PaymentButton from "../generator/PaymentButton";
import { useCertificatePayment } from "@/hooks/useCertificatePayment";
import { Badge } from "@/components/ui/badge";
import { generateMultiCompanyPDF } from "../utils/multiCompanyPdfGenerator";
import { uploadFileToBucket } from "@/integrations/supabase/storage";
import CertificateDateFilter from "./CertificateDateFilter";

export default function PromoterCertificatesPage() {
  const [approvedWork, setApprovedWork] = useState<CompanyWorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState<MultiCompanyCertificate | null>(null);
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const { isProcessing, initiateCertificatePayment } = useCertificatePayment();

  useEffect(() => {
    fetchApprovedWork();
  }, []);

  const fetchApprovedWork = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      setProfile(userProfile);

      // Fetch approved shift assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('shift_assignments')
        .select('id, shift_id, promoter_id, certificate_approved, approved_at')
        .eq('promoter_id', user.id)
        .eq('certificate_approved', true)
        .order('approved_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      if (!assignments || assignments.length === 0) {
        setApprovedWork([]);
        setLoading(false);
        return;
      }

      // Fetch shift details separately
      const shiftIds = assignments.map(a => a.shift_id);
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, title, date, start_time, end_time, location, company_id')
        .in('id', shiftIds);

      if (shiftsError) throw shiftsError;

      // Fetch company profiles separately
      const companyIds = [...new Set(shifts?.map(s => s.company_id) || [])];
      const { data: companies, error: companiesError } = await supabase
        .from('company_profiles')
        .select('user_id, name, logo_url, website')
        .in('user_id', companyIds);

      if (companiesError) throw companiesError;

      // Fetch time_logs separately for each shift (no direct FK relationship)
      const { data: timeLogs } = await supabase
        .from('time_logs')
        .select('shift_id, total_hours, check_in_time, check_out_time')
        .eq('user_id', user.id)
        .in('shift_id', shiftIds);

      // Create a map of shift_id to total hours
      const timeLogMap = new Map<string, number>();
      timeLogs?.forEach(log => {
        const current = timeLogMap.get(log.shift_id) || 0;
        timeLogMap.set(log.shift_id, current + (log.total_hours || 0));
      });

      // Create lookup maps
      const shiftMap = new Map(shifts?.map(s => [s.id, s]));
      const companyMap = new Map(companies?.map(c => [c.user_id, c]));
      const workMap = new Map<string, CompanyWorkEntry>();

      // Build work entries
      assignments.forEach((assignment) => {
        const shift = shiftMap.get(assignment.shift_id);
        if (!shift) return;

        const company = companyMap.get(shift.company_id);
        if (!company) return;

        if (!workMap.has(shift.company_id)) {
          workMap.set(shift.company_id, {
            company: {
              id: shift.company_id,
              name: company.name,
              logo_url: company.logo_url,
              website: company.website
            },
            shifts: [],
            totalHours: 0
          });
        }

        const entry = workMap.get(shift.company_id)!;
        const totalHours = timeLogMap.get(shift.id) || 0;

        entry.shifts.push({
          id: shift.id,
          title: shift.title,
          dateFrom: shift.date,
          dateTo: shift.date,
          timeFrom: shift.start_time,
          timeTo: shift.end_time,
          totalHours,
          location: shift.location,
          approvedAt: assignment.approved_at
        });

        entry.totalHours += totalHours;
      });

      setApprovedWork(Array.from(workMap.values()));
    } catch (error) {
      console.error('Error fetching approved work:', error);
      toast.error('Failed to load approved work');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    const filteredWork = getFilteredWork();
    
    if (filteredWork.length === 0) {
      toast.error('No approved work found in selected date range');
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const referenceNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const grandTotalHours = filteredWork.reduce((sum, company) => sum + company.totalHours, 0);

      const certData: MultiCompanyCertificate = {
        referenceNumber,
        promoterName: profile?.full_name || 'Unknown',
        issueDate: new Date().toISOString(),
        companies: filteredWork,
        grandTotalHours
      };

      // Generate PDF
      const pdfBlob = await generateMultiCompanyPDF(certData);
      const pdfFile = new File([pdfBlob], `certificate-${referenceNumber}.pdf`, { type: 'application/pdf' });

      // Upload PDF to storage
      const pdfPath = `certificates/${user.id}/${referenceNumber}.pdf`;
      const uploadResult = await uploadFileToBucket(pdfFile, 'certificates', pdfPath);

      if (!uploadResult.success) {
        throw new Error('Failed to upload PDF');
      }

      // Save certificate to database with PDF URL
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          reference_number: referenceNumber,
          certificate_type: 'work_experience',
          issue_date: new Date().toISOString(),
          total_hours: grandTotalHours,
          status: 'approved',
          paid: false,
          pdf_url: uploadResult.data
        })
        .select()
        .single();

      if (certError) throw certError;

      setCertificateData(certData);
      setGeneratedCertificateId(certificate.id);
      toast.success('Certificate generated! Please proceed to payment.');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handlePayment = async () => {
    if (!generatedCertificateId) return;
    await initiateCertificatePayment(generatedCertificateId);
  };

  const getFilteredWork = () => {
    return approvedWork.map(company => ({
      ...company,
      shifts: company.shifts.filter(shift => {
        const shiftDate = new Date(shift.dateFrom);
        if (dateFrom && shiftDate < dateFrom) return false;
        if (dateTo && shiftDate > dateTo) return false;
        return true;
      })
    })).filter(company => company.shifts.length > 0);
  };

  const filteredWork = getFilteredWork();
  const totalFilteredHours = filteredWork.reduce((sum, c) => sum + c.shifts.reduce((s, shift) => s + shift.totalHours, 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Work Certificates</CardTitle>
          <CardDescription>Loading approved work...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-secondary/50 p-1.5">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Generate Certificate</span>
            <span className="sm:hidden">Generate</span>
          </TabsTrigger>
          <TabsTrigger value="my-certificates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">My Certificates</span>
            <span className="sm:hidden">Saved</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6 space-y-6">
          {approvedWork.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Approved Work Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your completed shifts need to be approved by companies before you can generate certificates.
                  Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Date Filter */}
              {!certificateData && (
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
              )}

              {/* Preview Section */}
              {!certificateData && filteredWork.length > 0 && profile && (
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Certificate Preview
                    </CardTitle>
                    <CardDescription>
                      This is how your certificate will look. Review before generating.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MultiCompanyCertificatePreview 
                      data={{
                        referenceNumber: 'PREVIEW',
                        promoterName: profile.full_name,
                        issueDate: new Date().toISOString(),
                        companies: filteredWork,
                        grandTotalHours: totalFilteredHours
                      }} 
                    />
                    <div className="mt-6 p-4 bg-background rounded-lg border">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-2xl font-bold text-primary">{totalFilteredHours}h</p>
                          <p className="text-xs text-muted-foreground">Total Hours</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">{filteredWork.length}</p>
                          <p className="text-xs text-muted-foreground">Companies</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {filteredWork.reduce((sum, c) => sum + c.shifts.length, 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Shifts</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleGenerateCertificate}
                        disabled={generating}
                        className="w-full"
                        size="lg"
                      >
                        {generating ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Award className="h-4 w-4 mr-2" /> Generate Certificate ($4.99)</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {filteredWork.length === 0 && !certificateData && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Work in Selected Date Range</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Try adjusting your date filters to include more approved shifts.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Certificate Preview */}
              {certificateData && (
                <div className="space-y-6">
                  <MultiCompanyCertificatePreview data={certificateData} />
                  
                  {/* Payment Section */}
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Complete Your Purchase</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          $4.99
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Pay once and download this certificate anytime
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PaymentButton 
                        onClick={handlePayment}
                        isProcessing={isProcessing}
                        certificateGenerated={true}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="my-certificates" className="mt-6">
          <MyCertificates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
