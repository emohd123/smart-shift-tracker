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

export default function PromoterCertificatesPage() {
  const [approvedWork, setApprovedWork] = useState<CompanyWorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState<MultiCompanyCertificate | null>(null);
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null);
  const { isProcessing, initiateCertificatePayment } = useCertificatePayment();

  useEffect(() => {
    fetchApprovedWork();
  }, []);

  const fetchApprovedWork = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all approved shift assignments for this promoter
      const { data: assignments, error } = await supabase
        .from('shift_assignments')
        .select(`
          id,
          shift_id,
          promoter_id,
          certificate_approved,
          approved_at,
          shifts!inner (
            id,
            title,
            date,
            start_time,
            end_time,
            location,
            company_id,
            company_profiles:company_id (
              name,
              logo_url,
              website,
              email,
              phone
            )
          ),
          time_logs (
            total_hours,
            check_in_time,
            check_out_time
          )
        `)
        .eq('promoter_id', user.id)
        .eq('certificate_approved', true)
        .order('approved_at', { ascending: false });

      if (error) throw error;

      // Group by company
      const companyMap = new Map<string, CompanyWorkEntry>();

      assignments?.forEach((assignment: any) => {
        const shift = assignment.shifts;
        const company = shift.company_profiles;
        const companyId = shift.company_id;

        if (!companyMap.has(companyId)) {
          companyMap.set(companyId, {
            company: {
              id: companyId,
              name: company?.name || 'Unknown Company',
              logo_url: company?.logo_url || null,
              website: company?.website,
              email: company?.email,
              phone: company?.phone
            },
            shifts: [],
            totalHours: 0
          });
        }

        const entry = companyMap.get(companyId)!;
        const totalHours = assignment.time_logs?.reduce((sum: number, log: any) => sum + (log.total_hours || 0), 0) || 0;

        entry.shifts.push({
          id: shift.id,
          title: shift.title,
          dateFrom: shift.date,
          dateTo: shift.date, // Can be extended if needed
          timeFrom: shift.start_time,
          timeTo: shift.end_time,
          totalHours,
          location: shift.location,
          approvedAt: assignment.approved_at
        });

        entry.totalHours += totalHours;
      });

      setApprovedWork(Array.from(companyMap.values()));
    } catch (error) {
      console.error('Error fetching approved work:', error);
      toast.error('Failed to load approved work');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (approvedWork.length === 0) {
      toast.error('No approved work found');
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile for promoter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const referenceNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const grandTotalHours = approvedWork.reduce((sum, company) => sum + company.totalHours, 0);

      const certData: MultiCompanyCertificate = {
        referenceNumber,
        promoterName: profile?.full_name || 'Unknown',
        issueDate: new Date().toISOString(),
        companies: approvedWork,
        grandTotalHours
      };

      // Generate PDF
      const pdfBlob = await generateMultiCompanyPDF(certData);
      const pdfFile = new File([pdfBlob], `certificate-${referenceNumber}.pdf`, { type: 'application/pdf' });

      // Upload PDF to storage
      const pdfPath = `certificates/${user.id}/${referenceNumber}.pdf`;
      const uploadResult = await uploadFileToBucket('certificates', pdfPath, pdfFile);

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
              {/* Approved Work Summary */}
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Your Approved Work
                  </CardTitle>
                  <CardDescription>
                    Work from {approvedWork.length} {approvedWork.length === 1 ? 'company' : 'companies'} ready for certification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {approvedWork.reduce((sum, c) => sum + c.totalHours, 0)}h
                      </p>
                      <p className="text-xs text-muted-foreground">Total Hours</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{approvedWork.length}</p>
                      <p className="text-xs text-muted-foreground">Companies</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {approvedWork.reduce((sum, c) => sum + c.shifts.length, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Shifts</p>
                    </div>
                  </div>
                  
                  {!certificateData && (
                    <Button 
                      onClick={handleGenerateCertificate}
                      disabled={generating}
                      className="w-full mt-4"
                      size="lg"
                    >
                      {generating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Award className="h-4 w-4 mr-2" /> Generate Certificate</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

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
