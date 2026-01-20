import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Download, Calendar, DollarSign, Layers } from "lucide-react";
import { toast } from "sonner";
import { formatBHD } from "@/components/shifts/utils/paymentCalculations";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { isCompanyLike } from "@/utils/roleUtils";
import { ShiftPaymentGroupedView } from "./ShiftPaymentGroupedView";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

function IndividualReceiptsView() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const isCompany = isCompanyLike(userRole);

  useEffect(() => {
    if (user?.id) {
      fetchReceipts();
    }
  }, [user?.id, isCompany]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_receipts')
        .select(`
          *,
          shifts!shift_id (
            title,
            date,
            location
          ),
          company:company_id (
            full_name
          ),
          promoter:promoter_id (
            full_name
          )
        `)
        .order('receipt_date', { ascending: false });

      if (isCompany) {
        // Companies see receipts for their shifts
        query = query.eq('company_id', user?.id);
      } else {
        // Promoters see their own receipts
        query = query.eq('promoter_id', user?.id);
      }

      // Only filter by status if we have receipts, otherwise show all to debug
      // In production, you might want to keep: .eq('status', 'issued')
      const { data, error } = await query;

      if (error) {
        console.error("Detailed error fetching receipts:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // Filter to only show issued receipts on the client side
      const issuedReceipts = (data || []).filter((r: any) => r.status === 'issued');
      setReceipts(issuedReceipts);
    } catch (error: any) {
      console.error("Error fetching receipts:", error);
      toast.error(`Failed to load receipts: ${error.message || 'Unknown error'}`);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = !searchTerm || 
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.shifts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isCompany ? receipt.promoter?.full_name : receipt.company?.full_name)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = (!dateFilter.from || new Date(receipt.receipt_date) >= new Date(dateFilter.from)) &&
      (!dateFilter.to || new Date(receipt.receipt_date) <= new Date(dateFilter.to));

    return matchesSearch && matchesDate;
  });

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Loading receipts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by receipt number, shift, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <HelpTooltip content={tooltips.company.payments.search} />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            placeholder="From"
            value={dateFilter.from || ''}
            onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            placeholder="To"
            value={dateFilter.to || ''}
            onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
            className="w-40"
          />
          <HelpTooltip content={tooltips.company.payments.dateFilter} />
        </div>
      </div>

      {/* Summary */}
      {filteredReceipts.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                Total: {formatBHD(totalAmount)}
              </span>
              <HelpTooltip content={tooltips.company.payments.amount} />
            </div>
          </div>
        </div>
      )}

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || dateFilter.from || dateFilter.to
                ? "No receipts match your filters"
                : "No receipts found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((receipt) => {
            const shift = Array.isArray(receipt.shifts) ? receipt.shifts[0] : receipt.shifts;
            const otherParty = isCompany 
              ? (Array.isArray(receipt.promoter) ? receipt.promoter[0] : receipt.promoter)
              : (Array.isArray(receipt.company) ? receipt.company[0] : receipt.company);

            return (
              <Card 
                key={receipt.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/payments/receipts/${receipt.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold">{receipt.receipt_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(receipt.receipt_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {shift?.title || 'Shift'} • {otherParty?.full_name || 'N/A'}
                      </div>
                      {receipt.transaction_reference && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          Ref: {receipt.transaction_reference}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatBHD(receipt.amount)}
                      </div>
                      {receipt.pdf_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payments/receipts/${receipt.id}`);
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PaymentReceiptList() {
  const { userRole } = useAuth();
  const isCompany = isCompanyLike(userRole);

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isCompany ? "Payment Receipts" : "My Payment Receipts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="by-shift" className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="by-shift" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  By Shift
                </TabsTrigger>
                <TabsTrigger value="all-receipts" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  All Receipts
                </TabsTrigger>
              </TabsList>
              <HelpTooltip content="View receipts grouped by shift or as individual receipts" />
            </div>
            <TabsContent value="by-shift" className="mt-6">
              <ShiftPaymentGroupedView />
            </TabsContent>
            <TabsContent value="all-receipts" className="mt-6">
              <IndividualReceiptsView />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
