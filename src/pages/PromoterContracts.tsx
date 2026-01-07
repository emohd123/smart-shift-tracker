import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ScrollText } from "lucide-react";
import { generateContractTemplate } from "@/components/shifts/form/utils/contractTemplateGenerator";
import { parseLocalDate } from "@/utils/dateUtils";
import SignatureDialog from "@/components/certificates/SignatureDialog";

type ContractAcceptance = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  company_id: string;
  template_id: string;
  shift_id?: string;
  shift_assignment_id?: string;
  created_at: string;
  template?: {
    id: string;
    company_id: string;
    title: string;
    body_markdown: string;
  };
  company?: {
    company_name: string;
    full_name?: string;
  };
  shifts?: {
    id: string;
    title: string;
    date: string;
    end_date?: string;
    start_time: string;
    end_time: string;
    location?: string;
    description?: string;
    pay_rate?: number;
    pay_rate_type?: string;
  };
  contractHtml?: string;
};

export default function PromoterContracts() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [pendingContracts, setPendingContracts] = useState<ContractAcceptance[]>([]);
  const [acceptedContracts, setAcceptedContracts] = useState<ContractAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schemaNotFound, setSchemaNotFound] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [promoterName, setPromoterName] = useState("");

  const fetchContracts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setSchemaNotFound(false);

      // Try to fetch pending contracts - use any type to avoid schema errors
      try {
        const { data: pending, error: pendingError } = await (supabase as any)
          .from('company_contract_acceptances')
          .select(`
            *,
            shifts:shift_id (
              id,
              title,
              date,
              end_date,
              start_time,
              end_time,
              location,
              description,
              pay_rate,
              pay_rate_type
            )
          `)
          .eq('promoter_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!pendingError && pending) {
          // Fetch company names from both profiles and company_profiles
          const companyIds = [...new Set(pending.map((c: any) => c.company_id).filter(Boolean))];
          
          // Fetch from profiles table
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', companyIds);
          
          // Fetch from company_profiles table
          const { data: companyProfiles } = await supabase
            .from('company_profiles')
            .select('user_id, name')
            .in('user_id', companyIds);
          
          // Create a map combining both sources - prioritize company_profiles.name
          const companyMap = new Map();
          // First add profiles data
          profiles?.forEach((p: any) => {
            companyMap.set(p.id, { full_name: p.full_name });
          });
          // Then override/add company_profiles data (this takes priority)
          companyProfiles?.forEach((cp: any) => {
            const existing = companyMap.get(cp.user_id) || {};
            companyMap.set(cp.user_id, { 
              ...existing, 
              company_name: cp.name, // This is the primary company name
              full_name: cp.name || existing.full_name // Use company name as full_name if available
            });
          });
          
          // Fetch promoter's name and unique code
          const { data: promoterProfile } = await supabase
            .from('profiles')
            .select('full_name, unique_code')
            .eq('id', user.id)
            .single();
          
          const promoterName = promoterProfile?.full_name || '';
          const promoterUniqueCode = promoterProfile?.unique_code || '';
          
          // Fetch shift assignments to calculate payment per promoter
          const shiftIds = [...new Set(pending.map((c: any) => c.shift_id).filter(Boolean))];
          const assignmentCountMap = new Map();
          
          if (shiftIds.length > 0) {
            const { data: assignments } = await supabase
              .from('shift_assignments')
              .select('shift_id')
              .in('shift_id', shiftIds);
            
            assignments?.forEach((assignment: any) => {
              const count = assignmentCountMap.get(assignment.shift_id) || 0;
              assignmentCountMap.set(assignment.shift_id, count + 1);
            });
          }
          
          const enrichedPending = pending.map((contract: any) => {
            const shift = contract.shifts;
            const companyName = companyMap.get(contract.company_id)?.company_name || 
                               companyMap.get(contract.company_id)?.full_name || 
                               'Unknown Company';
            
            // Generate contract HTML if shift data is available
            let contractHtml = '';
            if (shift && shift.date && shift.start_time && shift.end_time) {
              const startDate = parseLocalDate(shift.date);
              const endDate = shift.end_date ? parseLocalDate(shift.end_date) : startDate;
              const paymentDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              
              // Calculate hours per day
              const [startHour, startMin] = shift.start_time.split(':').map(Number);
              const [endHour, endMin] = shift.end_time.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              const hoursPerDay = (endMinutes - startMinutes) / 60;
              
              // Calculate days difference
              const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              // Calculate payment
              const payRate = shift.pay_rate || 0;
              const payRateType = shift.pay_rate_type || 'hourly';
              const assignedCount = assignmentCountMap.get(shift.id) || 1;
              
              let totalPay = 0;
              if (payRateType === 'hourly') {
                totalPay = payRate * hoursPerDay * daysDiff * assignedCount;
              } else if (payRateType === 'daily') {
                totalPay = payRate * daysDiff * assignedCount;
              } else if (payRateType === 'fixed') {
                totalPay = payRate * assignedCount;
              }
              
              contractHtml = generateContractTemplate({
                shiftTitle: shift.title || 'Shift Contract',
                description: shift.description || '',
                location: shift.location || '',
                startDate,
                endDate,
                startTime: shift.start_time || '09:00',
                endTime: shift.end_time || '17:00',
                payRate,
                payRateType: payRateType as 'hourly' | 'daily' | 'fixed',
                paymentDate,
                promoterCount: assignedCount,
                totalEstimatedPay: totalPay,
                promoterName,
                promoterId: user.id,
                promoterUniqueCode,
                companyName,
                companyId: contract.company_id
              });
            }
            
            return {
              ...contract,
              company: companyMap.get(contract.company_id) || {},
              contractHtml
            };
          });
          
          setPendingContracts(enrichedPending || []);
        }
      } catch (err) {
        console.warn('Pending contracts fetch failed:', err);
      }

      // Try to fetch accepted contracts
      try {
        const { data: accepted, error: acceptedError } = await (supabase as any)
          .from('company_contract_acceptances')
          .select(`
            *,
            shifts:shift_id (
              id,
              title,
              date,
              end_date,
              start_time,
              end_time,
              location,
              description,
              pay_rate,
              pay_rate_type
            )
          `)
          .eq('promoter_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (!acceptedError && accepted) {
          // Fetch company names from both profiles and company_profiles
          const companyIds = [...new Set(accepted.map((c: any) => c.company_id).filter(Boolean))];
          
          // Fetch from profiles table
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', companyIds);
          
          // Fetch from company_profiles table
          const { data: companyProfiles } = await supabase
            .from('company_profiles')
            .select('user_id, name')
            .in('user_id', companyIds);
          
          // Create a map combining both sources - prioritize company_profiles.name
          const companyMap = new Map();
          // First add profiles data
          profiles?.forEach((p: any) => {
            companyMap.set(p.id, { full_name: p.full_name });
          });
          // Then override/add company_profiles data (this takes priority)
          companyProfiles?.forEach((cp: any) => {
            const existing = companyMap.get(cp.user_id) || {};
            companyMap.set(cp.user_id, { 
              ...existing, 
              company_name: cp.name, // This is the primary company name
              full_name: cp.name || existing.full_name // Use company name as full_name if available
            });
          });
          
          // Fetch promoter's name and unique code
          const { data: promoterProfile } = await supabase
            .from('profiles')
            .select('full_name, unique_code')
            .eq('id', user.id)
            .single();
          
          const promoterName = promoterProfile?.full_name || '';
          const promoterUniqueCode = promoterProfile?.unique_code || '';
          
          // Fetch shift assignments to calculate payment per promoter
          const shiftIds = [...new Set(accepted.map((c: any) => c.shift_id).filter(Boolean))];
          const assignmentCountMap = new Map();
          
          if (shiftIds.length > 0) {
            const { data: assignments } = await supabase
              .from('shift_assignments')
              .select('shift_id')
              .in('shift_id', shiftIds);
            
            assignments?.forEach((assignment: any) => {
              const count = assignmentCountMap.get(assignment.shift_id) || 0;
              assignmentCountMap.set(assignment.shift_id, count + 1);
            });
          }
          
          const enrichedAccepted = accepted.map((contract: any) => {
            const shift = contract.shifts;
            const companyName = companyMap.get(contract.company_id)?.company_name || 
                               companyMap.get(contract.company_id)?.full_name || 
                               'Unknown Company';
            
            // Generate contract HTML if shift data is available
            let contractHtml = '';
            if (shift && shift.date && shift.start_time && shift.end_time) {
              const startDate = parseLocalDate(shift.date);
              const endDate = shift.end_date ? parseLocalDate(shift.end_date) : startDate;
              const paymentDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              
              // Calculate hours per day
              const [startHour, startMin] = shift.start_time.split(':').map(Number);
              const [endHour, endMin] = shift.end_time.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              const hoursPerDay = (endMinutes - startMinutes) / 60;
              
              // Calculate days difference
              const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              // Calculate payment
              const payRate = shift.pay_rate || 0;
              const payRateType = shift.pay_rate_type || 'hourly';
              const assignedCount = assignmentCountMap.get(shift.id) || 1;
              
              let totalPay = 0;
              if (payRateType === 'hourly') {
                totalPay = payRate * hoursPerDay * daysDiff * assignedCount;
              } else if (payRateType === 'daily') {
                totalPay = payRate * daysDiff * assignedCount;
              } else if (payRateType === 'fixed') {
                totalPay = payRate * assignedCount;
              }
              
              contractHtml = generateContractTemplate({
                shiftTitle: shift.title || 'Shift Contract',
                description: shift.description || '',
                location: shift.location || '',
                startDate,
                endDate,
                startTime: shift.start_time || '09:00',
                endTime: shift.end_time || '17:00',
                payRate,
                payRateType: payRateType as 'hourly' | 'daily' | 'fixed',
                paymentDate,
                promoterCount: assignedCount,
                totalEstimatedPay: totalPay,
                promoterName,
                promoterId: user.id,
                promoterUniqueCode,
                companyName,
                companyId: contract.company_id
              });
            }
            
            return {
              ...contract,
              company: companyMap.get(contract.company_id) || {},
              contractHtml
            };
          });
          
          setAcceptedContracts(enrichedAccepted || []);
        }
      } catch (err) {
        console.warn('Accepted contracts fetch failed:', err);
      }
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      if (error?.message?.includes('does not exist')) {
        setSchemaNotFound(true);
        toast.info('Contract approval feature is not yet available');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Auto-expand contract if ID is in URL
  useEffect(() => {
    const contractId = searchParams.get('contract');
    if (contractId) {
      setExpandedId(contractId);
      // Scroll to the contract after a short delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById(`contract-${contractId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [searchParams, pendingContracts, acceptedContracts]);

  const handleApproveClick = (contractId: string) => {
    setSelectedContractId(contractId);
    setSignature("");
    setApprovalDialogOpen(true);
    
    // Fetch promoter name for signature dialog
    if (user?.id) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setPromoterName(data.full_name);
          }
        });
    }
  };

  const handleApprove = async () => {
    if (!selectedContractId || !signature.trim() || signature.trim().length < 3) {
      toast.error('Please enter your full name as signature (minimum 3 characters)');
      return;
    }

    try {
      setActionLoading(selectedContractId);

      // First, save the text signature
      const { error: updateError } = await (supabase as any)
        .from('company_contract_acceptances')
        .update({ 
          signature_text: signature.trim(),
          accept_user_agent: navigator.userAgent,
        })
        .eq('id', selectedContractId)
        .eq('promoter_id', user?.id);

      if (updateError) throw updateError;

      // Close text signature dialog and open fingerprint signature dialog
      setApprovalDialogOpen(false);
      setSignatureDialogOpen(true);
    } catch (error: any) {
      console.error('Error saving text signature:', error);
      toast.error('Failed to save signature');
      setActionLoading(null);
    }
  };

  const handleFingerprintSignatureComplete = async (signatureBase64: string) => {
    if (!selectedContractId) return;

    try {
      setActionLoading(selectedContractId);

      // Check if signature is too large (base64 images can be large, but we'll limit to ~1MB)
      if (signatureBase64.length > 1000000) {
        toast.error('Signature image is too large. Please try signing again.');
        setActionLoading(null);
        return;
      }

      // Save fingerprint signature and finalize approval
      const { error, data } = await (supabase as any)
        .from('company_contract_acceptances')
        .update({ 
          status: 'accepted',
          signature_image: signatureBase64,
          accepted_at: new Date().toISOString()
        })
        .eq('id', selectedContractId)
        .eq('promoter_id', user?.id)
        .select();

      if (error) {
        console.error('Error saving fingerprint signature:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details || error.hint);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to save fingerprint signature';
        if (error.code === '42501') {
          errorMessage = 'Permission denied. Please ensure you are signed in and have permission to update this contract.';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'The signature_image column may not exist. Please contact support.';
        } else if (error.message) {
          errorMessage = `Failed to save: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return;
      }

      toast.success('Contract approved and signed successfully!');
      setSignatureDialogOpen(false);
      setSelectedContractId(null);
      setSignature("");
      await fetchContracts();
    } catch (error: any) {
      console.error('Error saving fingerprint signature:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Failed to save fingerprint signature: ${error?.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contractId: string) => {
    try {
      setActionLoading(contractId);

      const { error } = await (supabase as any)
        .from('company_contract_acceptances')
        .update({ status: 'rejected' })
        .eq('id', contractId)
        .eq('promoter_id', user?.id);

      if (error) throw error;

      toast.success('Contract rejected');
      await fetchContracts();
    } catch (error: any) {
      console.error('Error rejecting contract:', error);
      toast.error('Failed to reject contract');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Contract Approvals">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Contract Approvals">
      <div className="space-y-8">
        {schemaNotFound && (
          <Card className="border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Feature Coming Soon</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contract approval functionality will be available soon. For now, contracts are managed through shift assignments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Contracts */}
        {pendingContracts.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                Pending Contracts ({pendingContracts.length})
              </h2>
              <p className="text-muted-foreground mt-1">
                Please review and approve the following contracts to work with these companies
              </p>
            </div>

            <div className="space-y-4">
              {pendingContracts.map((contract: any) => (
                <Card key={contract.id} id={`contract-${contract.id}`} className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <ScrollText className="h-5 w-5 text-amber-600" />
                          {contract.shifts?.title || 'Unnamed Contract'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          By {contract.company?.company_name || contract.company?.full_name || 'Unknown Company'}
                          {contract.shifts && (
                            <span className="block mt-1">
                              For shift: {contract.shifts.title} • {contract.shifts.date ? new Date(contract.shifts.date).toLocaleDateString() : 'Date TBD'}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedId(expandedId === contract.id ? null : contract.id)
                        }
                        className="w-full justify-between"
                      >
                        {expandedId === contract.id ? 'Hide' : 'View'} Contract Details
                        <span className="text-xs">
                          {expandedId === contract.id ? '▼' : '▶'}
                        </span>
                      </Button>
                    </div>

                    {expandedId === contract.id && (
                      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        {contract.contractHtml ? (
                          <div className="overflow-auto h-[600px]">
                            <iframe
                              srcDoc={contract.contractHtml}
                              title="Detailed Contract Preview"
                              className="w-full h-full border-none"
                              style={{ minHeight: "600px" }}
                            />
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            Contract details are not available. Please contact the company.
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveClick(contract.id)}
                        disabled={actionLoading === contract.id}
                        className="flex-1"
                      >
                        {actionLoading === contract.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Approve Contract
                      </Button>
                      <Button
                        onClick={() => handleReject(contract.id)}
                        disabled={actionLoading === contract.id}
                        variant="outline"
                        className="flex-1"
                      >
                        {actionLoading === contract.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Contracts */}
        {acceptedContracts.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Approved Contracts ({acceptedContracts.length})
              </h2>
              <p className="text-muted-foreground mt-1">
                You can now work with these companies
              </p>
            </div>

            <div className="space-y-3">
              {acceptedContracts.map((contract: any) => (
                <Card key={contract.id} className="border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          {contract.shifts?.title || 'Unnamed Contract'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          By {contract.company?.company_name || contract.company?.full_name || 'Unknown Company'}
                          {contract.shifts && (
                            <span className="block">For shift: {contract.shifts.title}</span>
                          )}
                          <span className="block">Approved on {new Date(contract.accepted_at || contract.created_at).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId(expandedId === contract.id ? null : contract.id)
                      }
                      className="w-full justify-between"
                    >
                      {expandedId === contract.id ? 'Hide' : 'View'} Contract Details
                      <span className="text-xs">
                        {expandedId === contract.id ? '▼' : '▶'}
                      </span>
                    </Button>

                    {expandedId === contract.id && (
                      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        {contract.contractHtml ? (
                          <div className="overflow-auto h-[600px]">
                            <iframe
                              srcDoc={contract.contractHtml}
                              title="Detailed Contract Preview"
                              className="w-full h-full border-none"
                              style={{ minHeight: "600px" }}
                            />
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            Contract details are not available.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!schemaNotFound && pendingContracts.length === 0 && acceptedContracts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Contracts</h3>
              <p className="text-muted-foreground text-center mt-2">
                You don't have any contracts to review yet. When companies assign you to
                shifts, their contracts will appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Approval Dialog with Signature */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Contract</DialogTitle>
              <DialogDescription>
                Please enter your full name as a digital signature. After approval, you will be asked to sign using your finger/touch.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Your Full Name (Signature)</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g., Ebrahim Mohd"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This digital signature will be recorded with timestamp and device information.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApprovalDialogOpen(false);
                  setSelectedContractId(null);
                  setSignature("");
                }}
                disabled={actionLoading !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!signature.trim() || signature.trim().length < 3 || actionLoading !== null}
              >
                {actionLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Approve & Sign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Fingerprint Signature Dialog */}
        <SignatureDialog
          open={signatureDialogOpen}
          onOpenChange={(open) => {
            setSignatureDialogOpen(open);
            if (!open && selectedContractId) {
              // If dialog is closed without completing signature, reset state
              setSelectedContractId(null);
              setSignature("");
              setActionLoading(null);
            }
          }}
          onSignatureComplete={handleFingerprintSignatureComplete}
          promoterName={promoterName || "Promoter"}
          title="Sign Contract with Fingerprint"
          description={`Please sign below using your finger or touch to finalize the contract approval, ${promoterName || "Promoter"}.`}
          confirmButtonText="Confirm & Approve Contract"
        />
      </div>
    </AppLayout>
  );
}
