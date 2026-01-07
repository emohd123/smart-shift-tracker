import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Loader2, AlertCircle, CreditCard } from "lucide-react";
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
import SignatureDialog from "../SignatureDialog";
import { buildBdfCertificateDataFromMultiCompany } from "../utils/bdfCertificateData";

export default function PromoterCertificatesPage() {
  const [approvedWork, setApprovedWork] = useState<CompanyWorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState<MultiCompanyCertificate | null>(null);
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const { isProcessing, initiateCertificatePayment } = useCertificatePayment();

  useEffect(() => {
    fetchApprovedWork();
  }, []);

  // Payment success handler - Generate PDF after payment
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      handlePostPaymentPDFGeneration();
    } else if (canceled === 'true') {
      toast.info('Payment was canceled. You can try again when ready.');
      window.history.replaceState({}, '', '/certificates');
    }
  }, []);

  const handlePostPaymentPDFGeneration = async () => {
    const loadingToast = toast.loading('Generating your certificate...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.dismiss(loadingToast);
        return;
      }

      // Find the certificate that was just paid for (most recent pending one that's now paid)
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('paid', true)
        .is('pdf_url', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (certError || !certificate) {
        console.log('No certificate found to generate PDF for');
        toast.dismiss(loadingToast);
        setActiveTab('my-certificates');
        toast.success('Payment successful! Your certificate is ready.');
        window.history.replaceState({}, '', '/certificates');
        return;
      }

      // Parse stored data from time_period field
      const storedData = certificate.time_period ? JSON.parse(certificate.time_period) : null;
      
      if (!storedData) {
        throw new Error('Certificate data not found');
      }

      // Generate PDF from stored data (including signature if present)
      const certData: MultiCompanyCertificate = {
        referenceNumber: certificate.reference_number,
        promoterName: storedData.promoterName,
        issueDate: certificate.issue_date,
        companies: storedData.companies,
        grandTotalHours: certificate.total_hours,
        signature: storedData.signature || undefined,
      };

      const pdfBlob = await generateMultiCompanyPDF(certData);
      const pdfFile = new File([pdfBlob], `certificate-${certificate.reference_number}.pdf`, { type: 'application/pdf' });

      // Upload PDF to storage
      const pdfPath = `certificates/${user.id}/${certificate.reference_number}.pdf`;
      const uploadResult = await uploadFileToBucket(pdfFile, 'certificates', pdfPath);

      if (uploadResult.success) {
        // Update certificate with PDF URL and active status
        await supabase
          .from('certificates')
          .update({ 
            pdf_url: uploadResult.data, 
            status: 'active' 
          })
          .eq('id', certificate.id);
      }

      toast.dismiss(loadingToast);
      setActiveTab('my-certificates');
      toast.success('Payment successful! Your certificate is ready.');
      window.history.replaceState({}, '', '/certificates');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss(loadingToast);
      setActiveTab('my-certificates');
      toast.success('Payment successful! Certificate processing...');
      window.history.replaceState({}, '', '/certificates');
    }
  };

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

      // Fetch approved shift assignments (work must be approved before certificate generation)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('shift_assignments')
        .select('id, shift_id, promoter_id, work_approved, work_approved_at, certificate_approved, approved_at')
        .eq('promoter_id', user.id)
        .eq('work_approved', true) // Work must be approved first
        .order('work_approved_at', { ascending: false });

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

      // Fetch company profiles separately with all needed fields
      const companyIds = [...new Set(shifts?.map(s => s.company_id) || [])];
      const { data: companies, error: companiesError } = await supabase
        .from('company_profiles')
        .select('user_id, name, logo_url, website, registration_id')
        .in('user_id', companyIds);

      if (companiesError) throw companiesError;

      // Fetch company user profiles for phone and email
      const { data: companyUsers } = await supabase
        .from('profiles')
        .select('id, phone_number, email')
        .in('id', companyIds);

      const companyUserMap = new Map(companyUsers?.map(u => [u.id, u]) || []);

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
          const companyUser = companyUserMap.get(shift.company_id);
          workMap.set(shift.company_id, {
            company: {
              id: shift.company_id,
              name: company.name,
              logo_url: company.logo_url,
              website: company.website,
              registration_number: company.registration_id || null,
              phone_number: companyUser?.phone_number || null,
              email: companyUser?.email || null
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
          approvedAt: assignment.work_approved_at || assignment.approved_at
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

  // First show signature dialog before payment
  const handleRequestSignature = () => {
    const filteredWork = getFilteredWork();
    
    if (filteredWork.length === 0) {
      toast.error('No approved work found in selected date range');
      return;
    }

    setShowSignatureDialog(true);
  };

  // Called after signature is provided
  const handleSignatureComplete = (signatureBase64: string) => {
    setPendingSignature(signatureBase64);
    handlePayAndGenerate(signatureBase64);
  };

  const handlePayAndGenerate = async (signature?: string) => {
    const filteredWork = getFilteredWork();
    
    if (filteredWork.length === 0) {
      toast.error('No approved work found in selected date range');
      return;
    }

    setGenerating(true);
    
    const loadingToast = toast.loading('Preparing your certificate...', {
      description: 'You will be redirected to payment shortly'
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.dismiss(loadingToast);
        toast.error('Please log in to continue');
        setGenerating(false);
        return;
      }

      const referenceNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const grandTotalHours = filteredWork.reduce((sum, company) => sum + company.totalHours, 0);

      const bdfData = buildBdfCertificateDataFromMultiCompany({
        referenceNumber,
        promoterName: profile?.full_name || 'Unknown',
        issueDate: new Date().toISOString(),
        companies: filteredWork,
        grandTotalHours,
        signature: signature || pendingSignature || undefined,
      });

      // Create PENDING certificate record (NO PDF yet)
      // Store certificate data as JSON in time_period field for later PDF generation
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          reference_number: referenceNumber,
          certificate_type: 'work_experience',
          issue_date: new Date().toISOString(),
          total_hours: grandTotalHours,
          status: 'pending',
          paid: false,
          // Store data needed for PDF generation as JSON (including signature)
          time_period: JSON.stringify({
            promoterName: profile?.full_name || 'Unknown',
            companies: filteredWork,
            signature: signature || pendingSignature || null,
            bdf: bdfData,
          })
        })
        .select()
        .single();

      if (certError) {
        console.error('Certificate creation error:', certError);
        throw new Error(`Failed to create certificate: ${certError.message}`);
      }

      toast.dismiss(loadingToast);
      toast.loading('Redirecting to payment...', {
        description: 'Please complete the payment on Stripe'
      });

      // Redirect to payment immediately - PDF will be generated after successful payment
      await initiateCertificatePayment(certificate.id);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error:', error);
      toast.error(error.message || 'Failed to process. Please try again.');
      setGenerating(false);
    }
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
  const totalFilteredShifts = filteredWork.reduce((sum, c) => sum + c.shifts.length, 0);

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <p className="text-sm text-muted-foreground max-w-md mb-2">
                  Your completed shifts need to be approved by the company before you can generate certificates.
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Once a company approves your work for a completed shift, it will appear here. Check back soon or contact the company if your shift has been completed.
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
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={handleRequestSignature}
                  disabled={generating || isProcessing}
                  className="w-full max-w-md bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500"
                  size="lg"
                >
                  {generating || isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                      {generating ? 'Preparing...' : 'Redirecting...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" /> 
                      Sign & Pay $4.99 to Generate Certificate
                    </>
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

            </>
          )}
        </TabsContent>

        <TabsContent value="my-certificates" className="mt-6">
          <MyCertificates />
        </TabsContent>
      </Tabs>

      {/* Signature Dialog */}
      <SignatureDialog
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onSignatureComplete={handleSignatureComplete}
        promoterName={profile?.full_name || 'Part-Timer'}
      />
    </div>
  );
}
