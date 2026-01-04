import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ScrollText } from "lucide-react";

type ContractAcceptance = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  company_id: string;
  template_id: string;
  created_at: string;
  template?: {
    id: string;
    company_id: string;
    title: string;
    body_markdown: string;
  };
  company?: {
    company_name: string;
  };
};

export default function PromoterContracts() {
  const { user } = useAuth();
  const [pendingContracts, setPendingContracts] = useState<ContractAcceptance[]>([]);
  const [acceptedContracts, setAcceptedContracts] = useState<ContractAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schemaNotFound, setSchemaNotFound] = useState(false);

  const fetchContracts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setSchemaNotFound(false);

      // Try to fetch pending contracts - use any type to avoid schema errors
      try {
        const { data: pending, error: pendingError } = await (supabase as any)
          .from('company_contract_acceptances')
          .select(`*`)
          .eq('promoter_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!pendingError) {
          setPendingContracts(pending || []);
        }
      } catch (err) {
        console.warn('Pending contracts fetch failed:', err);
      }

      // Try to fetch accepted contracts
      try {
        const { data: accepted, error: acceptedError } = await (supabase as any)
          .from('company_contract_acceptances')
          .select(`*`)
          .eq('promoter_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (!acceptedError) {
          setAcceptedContracts(accepted || []);
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

  const handleApprove = async (contractId: string) => {
    try {
      setActionLoading(contractId);

      const { error } = await (supabase as any)
        .from('company_contract_acceptances')
        .update({ status: 'accepted' })
        .eq('id', contractId)
        .eq('promoter_id', user?.id);

      if (error) throw error;

      toast.success('Contract approved successfully!');
      await fetchContracts();
    } catch (error: any) {
      console.error('Error approving contract:', error);
      toast.error('Failed to approve contract');
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
                <Card key={contract.id} className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <ScrollText className="h-5 w-5 text-amber-600" />
                          {contract.template?.title || contract.title || 'Unnamed Contract'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          By {contract.company?.company_name || 'Unknown Company'}
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
                      <div className="p-4 rounded-lg bg-background border border-border/50">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {contract.template?.body_markdown && (
                            <div
                              className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80"
                              style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Courier, monospace',
                              }}
                            >
                              {contract.template.body_markdown}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(contract.id)}
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
                          {contract.template?.title || contract.title || 'Unnamed Contract'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          By {contract.company?.company_name || 'Unknown Company'} •{' '}
                          Approved on{' '}
                          {new Date(contract.created_at).toLocaleDateString()}
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
                      <div className="mt-3 p-4 rounded-lg bg-background border border-border/50">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {contract.template?.body_markdown && (
                            <div
                              className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80"
                              style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Courier, monospace',
                              }}
                            >
                              {contract.template.body_markdown}
                            </div>
                          )}
                        </div>
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
      </div>
    </AppLayout>
  );
}
