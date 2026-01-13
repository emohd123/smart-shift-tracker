import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  ChevronRight,
} from "lucide-react";
import { formatBHD } from "@/components/shifts/utils/paymentCalculations";
import { format } from "date-fns";
import { useShiftPayments } from "@/hooks/payments/useShiftPayments";
import { ShiftPaymentDetails } from "./ShiftPaymentDetails";

export function ShiftPaymentGroupedView() {
  const { shiftPayments, loading } = useShiftPayments();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const [selectedShift, setSelectedShift] = useState<string | null>(null);

  const filteredShifts = shiftPayments.filter((shift) => {
    const matchesSearch =
      !searchTerm ||
      shift.shift_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.shift_location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      (!dateFilter.from ||
        new Date(shift.shift_date) >= new Date(dateFilter.from)) &&
      (!dateFilter.to || new Date(shift.shift_date) <= new Date(dateFilter.to));

    return matchesSearch && matchesDate;
  });

  const totalAmount = filteredShifts.reduce(
    (sum, shift) => sum + shift.total_amount,
    0
  );

  const selectedShiftData = shiftPayments.find(
    (s) => s.shift_id === selectedShift
  );

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading shift payments...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by shift title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="From"
            value={dateFilter.from || ""}
            onChange={(e) =>
              setDateFilter({ ...dateFilter, from: e.target.value })
            }
            className="w-40"
          />
          <Input
            type="date"
            placeholder="To"
            value={dateFilter.to || ""}
            onChange={(e) =>
              setDateFilter({ ...dateFilter, to: e.target.value })
            }
            className="w-40"
          />
        </div>
      </div>

      {/* Summary */}
      {filteredShifts.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filteredShifts.length} shift{filteredShifts.length !== 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold">
              Total: {formatBHD(totalAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Shifts List */}
      {filteredShifts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || dateFilter.from || dateFilter.to
                ? "No shifts match your filters"
                : "No shift payments found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredShifts.map((shift) => (
            <Card
              key={shift.shift_id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedShift(shift.shift_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{shift.shift_title}</h3>
                      <Badge variant="outline">
                        {format(new Date(shift.shift_date), "MMM dd, yyyy")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {shift.shift_location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shift.shift_location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {shift.promoter_count} promoter
                        {shift.promoter_count !== 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {shift.receipts.length} receipt
                        {shift.receipts.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatBHD(shift.total_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Paid</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shift Details Dialog */}
      <Dialog
        open={selectedShift !== null}
        onOpenChange={(open) => !open && setSelectedShift(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedShiftData?.shift_title} - Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedShiftData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Shift Date</div>
                  <div className="font-medium">
                    {format(new Date(selectedShiftData.shift_date), "MMM dd, yyyy")}
                  </div>
                </div>
                {selectedShiftData.shift_location && (
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{selectedShiftData.shift_location}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Promoters Paid</div>
                  <div className="font-medium">{selectedShiftData.promoter_count}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="font-medium text-green-600">
                    {formatBHD(selectedShiftData.total_amount)}
                  </div>
                </div>
              </div>
              <ShiftPaymentDetails
                shiftId={selectedShiftData.shift_id}
                receipts={selectedShiftData.receipts}
                onClose={() => setSelectedShift(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
