import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Promoter {
  id: string;
  full_name: string;
  unique_code: string;
  profile_photo_url: string | null;
  phone_number: string | null;
  verification_status: string;
  total_shifts?: number;
  total_hours?: number;
  contractAccepted?: boolean;
}

interface BrowsePromotersCardProps {
  companyId: string;
}

export function BrowsePromotersCard({ companyId }: BrowsePromotersCardProps) {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPromoters();
  }, [companyId]);

  const loadPromoters = async () => {
    try {
      setLoading(true);

      // Use list_eligible_promoters RPC
      const { data, error } = await supabase.rpc('list_eligible_promoters');

      if (error) throw error;

      // Check contract acceptance for each promoter
      const { data: template } = await supabase
        .from('company_contract_templates')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .maybeSingle();

      if (template) {
        const { data: acceptances } = await supabase
          .from('company_contract_acceptances')
          .select('promoter_id')
          .eq('company_id', companyId);

        const acceptedIds = new Set(acceptances?.map(a => a.promoter_id) || []);

        setPromoters(data.map((p: any) => ({
          ...p,
          contractAccepted: acceptedIds.has(p.id)
        })));
      } else {
        setPromoters(data || []);
      }
    } catch (error: any) {
      console.error("Error loading promoters:", error);
      toast.error("Failed to load promoters");
    } finally {
      setLoading(false);
    }
  };

  const filteredPromoters = promoters.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.unique_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Promoters</CardTitle>
          <CardDescription>Browse and view approved promoters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Promoters</CardTitle>
        <CardDescription>
          {filteredPromoters.length} approved promoter{filteredPromoters.length !== 1 ? 's' : ''} available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Promoters List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredPromoters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No promoters found</p>
            </div>
          ) : (
            filteredPromoters.map((promoter) => (
              <div
                key={promoter.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={promoter.profile_photo_url || ""} />
                  <AvatarFallback>
                    {promoter.full_name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{promoter.full_name}</p>
                    {promoter.verification_status === 'approved' && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Code: {promoter.unique_code}</span>
                    {promoter.total_shifts !== undefined && (
                      <span>• {promoter.total_shifts} shifts</span>
                    )}
                    {promoter.total_hours !== undefined && (
                      <span>• {promoter.total_hours}h</span>
                    )}
                  </div>
                </div>

                {/* Contract Status */}
                {promoter.contractAccepted !== undefined && (
                  <Badge
                    variant={promoter.contractAccepted ? "default" : "outline"}
                    className="flex-shrink-0"
                  >
                    {promoter.contractAccepted ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Contract Signed
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Awaiting Contract
                      </>
                    )}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>

        {filteredPromoters.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/shifts/create'}
          >
            Create Shift to Assign Promoters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
