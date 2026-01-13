import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Building2, Calendar, DollarSign, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatBHD } from "@/components/shifts/utils/paymentCalculations";
import { formatIBAN } from "@/utils/ibanValidation";
import { format } from "date-fns";

export default function PaymentReceiptViewer() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  const fetchReceipt = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select(`
          *,
          shifts:shift_id (
            title,
            date,
            end_date,
            start_time,
            end_time,
            location
          ),
          company:company_id (
            full_name,
            email,
            phone_number
          ),
          promoter:promoter_id (
            full_name,
            email,
            phone_number
          )
        `)
        .eq('id', receiptId)
        .single();

      if (error) throw error;
      setReceipt(data);
    } catch (error: any) {
      console.error("Error fetching receipt:", error);
      toast.error("Failed to load receipt");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!receipt?.pdf_url) {
      toast.error("Receipt file not available yet. Please try again later.");
      return;
    }

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .download(receipt.pdf_url);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        // Determine file extension from URL
        const isPDF = receipt.pdf_url.endsWith('.pdf');
        a.download = `receipt-${receipt.receipt_number}.${isPDF ? 'pdf' : 'html'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Receipt downloaded successfully${isPDF ? '' : ' (HTML - print to PDF from browser)'}`);
      }
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Receipt not found</p>
            <Button onClick={() => navigate('/payments/receipts')} className="mt-4">
              Back to Receipts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shift = Array.isArray(receipt.shifts) ? receipt.shifts[0] : receipt.shifts;
  const company = Array.isArray(receipt.company) ? receipt.company[0] : receipt.company;
  const promoter = Array.isArray(receipt.promoter) ? receipt.promoter[0] : receipt.promoter;

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate('/payments/receipts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Receipts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Receipt
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Receipt Number: {receipt.receipt_number}
              </p>
            </div>
            {receipt.pdf_url && (
              <Button onClick={downloadPDF} variant="outline" disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Box */}
          <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Amount Paid</div>
            <div className="text-3xl font-bold text-green-700">
              {formatBHD(receipt.amount)}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5" />
              <h4 className="font-semibold">Payment Details</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">
                  {receipt.payment_method === 'bank_transfer' ? 'Bank Transfer' : receipt.payment_method}
                </span>
              </div>
              {receipt.transaction_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction Reference:</span>
                  <span className="font-mono font-medium">{receipt.transaction_reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Date:</span>
                <span>{format(new Date(receipt.receipt_date), "MMM dd, yyyy")}</span>
              </div>
              {receipt.bank_transfer_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{format(new Date(receipt.bank_transfer_date), "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          {/* From (Company) */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">From (Company)</h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Company:</span>
                <span className="ml-2 font-medium">{company?.full_name || 'N/A'}</span>
              </div>
              {company?.email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2">{company.email}</span>
                </div>
              )}
              {company?.phone_number && (
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2">{company.phone_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* To (Promoter) */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">To (Promoter)</h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{promoter?.full_name || 'N/A'}</span>
              </div>
              {promoter?.email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2">{promoter.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Details */}
          {receipt.iban_number && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5" />
                <h4 className="font-semibold">Bank Details</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">IBAN:</span>
                  <span className="ml-2 font-mono font-medium">{formatIBAN(receipt.iban_number)}</span>
                </div>
                {receipt.bank_name && (
                  <div>
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="ml-2">{receipt.bank_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shift Information */}
          {shift && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5" />
                <h4 className="font-semibold">Shift Information</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Shift:</span>
                  <span className="ml-2 font-medium">{shift.title || 'N/A'}</span>
                </div>
                {shift.date && (
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <span className="ml-2">{format(new Date(shift.date), "MMM dd, yyyy")}</span>
                  </div>
                )}
                {shift.start_time && shift.end_time && (
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <span className="ml-2">{shift.start_time} - {shift.end_time}</span>
                  </div>
                )}
                {shift.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="ml-2">{shift.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {receipt.notes && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-muted-foreground">{receipt.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
