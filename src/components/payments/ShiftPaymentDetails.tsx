import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Download,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  User,
  FileText,
} from "lucide-react";
import { formatBHD } from "@/components/shifts/utils/paymentCalculations";
import { format } from "date-fns";
import { usePromoterTimesheetHistory } from "@/hooks/payments/usePromoterTimesheetHistory";

interface ShiftPaymentDetailsProps {
  shiftId: string;
  receipts: Array<{
    id: string;
    receipt_number: string;
    receipt_date: string;
    amount: number;
    promoter_id: string;
    promoter_name: string;
    transaction_reference: string | null;
    pdf_url: string | null;
  }>;
  onClose?: () => void;
}

export function ShiftPaymentDetails({
  shiftId,
  receipts,
  onClose,
}: ShiftPaymentDetailsProps) {
  const navigate = useNavigate();
  const [expandedPromoter, setExpandedPromoter] = useState<string | null>(null);

  const handleViewReceipt = (receiptId: string) => {
    navigate(`/payments/receipts/${receiptId}`);
  };

  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No payment receipts found for this shift.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Details</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Accordion
        type="single"
        collapsible
        value={expandedPromoter || undefined}
        onValueChange={setExpandedPromoter}
        className="space-y-2"
      >
        {receipts.map((receipt) => {
          return (
            <PromoterPaymentCard
              key={receipt.id}
              receipt={receipt}
              shiftId={shiftId}
              onViewReceipt={() => handleViewReceipt(receipt.id)}
            />
          );
        })}
      </Accordion>
    </div>
  );
}

interface PromoterPaymentCardProps {
  receipt: {
    id: string;
    receipt_number: string;
    receipt_date: string;
    amount: number;
    promoter_id: string;
    promoter_name: string;
    transaction_reference: string | null;
    pdf_url: string | null;
  };
  shiftId: string;
  onViewReceipt: () => void;
}

const PromoterPaymentCard = ({
  receipt,
  shiftId,
  onViewReceipt,
}: PromoterPaymentCardProps) => {
  const { timesheetHistory, loading: timesheetLoading } =
    usePromoterTimesheetHistory(shiftId, receipt.promoter_id);

  return (
    <AccordionItem value={receipt.promoter_id} className="border rounded-lg">
      <Card>
        <CardContent className="p-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{receipt.promoter_name}</span>
                </div>
                <Badge variant="outline" className="ml-2">
                  {receipt.receipt_number}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatBHD(receipt.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(receipt.receipt_date), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              {/* Payment Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Receipt Number</div>
                  <div className="font-mono text-sm">{receipt.receipt_number}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Date</div>
                  <div className="text-sm">
                    {format(new Date(receipt.receipt_date), "MMM dd, yyyy 'at' HH:mm")}
                  </div>
                </div>
                {receipt.transaction_reference && (
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">
                      Transaction Reference
                    </div>
                    <div className="font-mono text-sm">
                      {receipt.transaction_reference}
                    </div>
                  </div>
                )}
              </div>

              {/* Timesheet Summary */}
              {timesheetLoading ? (
                <div className="text-sm text-muted-foreground">Loading timesheet...</div>
              ) : timesheetHistory && timesheetHistory.summary.log_count > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Timesheet Summary
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Hours</div>
                      <div className="text-sm font-semibold">
                        {timesheetHistory.summary.total_hours.toFixed(2)} hrs
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Earnings</div>
                      <div className="text-sm font-semibold">
                        {formatBHD(timesheetHistory.summary.total_earnings)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Log Entries</div>
                      <div className="text-sm font-semibold">
                        {timesheetHistory.summary.log_count}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Timesheet History */}
                  {timesheetHistory.logs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Time Log History</div>
                      <div className="space-y-2">
                        {timesheetHistory.logs.map((log) => (
                          <Card key={log.id} className="p-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  Check In
                                </div>
                                <div>
                                  {format(
                                    new Date(log.check_in_time),
                                    "MMM dd, yyyy 'at' HH:mm"
                                  )}
                                </div>
                              </div>
                              {log.check_out_time && (
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Check Out
                                  </div>
                                  <div>
                                    {format(
                                      new Date(log.check_out_time),
                                      "MMM dd, yyyy 'at' HH:mm"
                                    )}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-xs text-muted-foreground">Hours</div>
                                <div className="font-medium">
                                  {log.total_hours?.toFixed(2) || "0.00"} hrs
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Earnings</div>
                                <div className="font-medium text-green-600">
                                  {formatBHD(log.earnings || 0)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No timesheet data available
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewReceipt}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
                {receipt.pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewReceipt}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </CardContent>
      </Card>
    </AccordionItem>
  );
};
