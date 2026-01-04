import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, calculateWorkHours, calculateDailyPay } from "../utils/paymentScheduleCalculator";

interface PromoterAssignmentStepProps {
  formData: any;
  onChange: (promoters: any[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface Promoter {
  id: string;
  full_name: string;
  unique_code: string;
  verification_status: string;
}

export default function PromoterAssignmentStep({
  formData,
  onChange,
  onNext,
  onPrevious
}: PromoterAssignmentStepProps) {
  const { user } = useAuth();
  const [availablePromoters, setAvailablePromoters] = useState<Promoter[]>([]);
  const [assignedPromoters, setAssignedPromoters] = useState<any[]>(formData.assignedPromoters || []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPromoters();
  }, [user?.id]);

  const loadPromoters = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, unique_code, verification_status")
        .eq("role", "promoter")
        .eq("verification_status", "approved")
        .order("full_name");

      if (error) throw error;
      setAvailablePromoters(data || []);
    } catch (error) {
      console.error("Error loading promoters:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkHoursForShift = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    return calculateWorkHours(formData.startTime, formData.endTime);
  };

  const calculatePayForPromoter = (workHours: number) => {
    const rate = parseFloat(formData.payRate) || 0;
    if (formData.payRateType === "hourly") {
      return calculateDailyPay(rate, workHours);
    } else if (formData.payRateType === "daily") {
      return rate;
    } else {
      return rate;
    }
  };

  const handleAddPromoter = (promoter: Promoter) => {
    const workHours = calculateWorkHoursForShift();
    const estimatedPay = calculatePayForPromoter(workHours);

    const newAssignment = {
      id: promoter.id,
      fullName: promoter.full_name,
      uniqueCode: promoter.unique_code,
      workHours,
      estimatedPay
    };

    const updated = [...assignedPromoters, newAssignment];
    setAssignedPromoters(updated);
    onChange(updated);
  };

  const handleRemovePromoter = (promoterId: string) => {
    const updated = assignedPromoters.filter(p => p.id !== promoterId);
    setAssignedPromoters(updated);
    onChange(updated);
  };

  const handleWorkHoursChange = (promoterId: string, hours: number) => {
    const updated = assignedPromoters.map(p =>
      p.id === promoterId
        ? { ...p, workHours: hours, estimatedPay: calculatePayForPromoter(hours) }
        : p
    );
    setAssignedPromoters(updated);
    onChange(updated);
  };

  const filteredPromoters = availablePromoters.filter(
    p =>
      !assignedPromoters.find(a => a.id === p.id) &&
      (p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.unique_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalEstimatedPay = assignedPromoters.reduce((sum, p) => sum + p.estimatedPay, 0);
  const defaultWorkHours = calculateWorkHoursForShift();

  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 Assign Promoters</CardTitle>
        <CardDescription>
          Select approved promoters to assign to this shift
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <Alert className="bg-purple-50 border-purple-200">
          <AlertDescription className="text-purple-900">
            <strong>Total Assigned:</strong> {assignedPromoters.length} promoters | 
            <strong className="ml-4">Total Estimated Payment:</strong> {formatCurrency(totalEstimatedPay)}
          </AlertDescription>
        </Alert>

        {/* Assigned Promoters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Assigned Promoters ({assignedPromoters.length})</h3>
          {assignedPromoters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No promoters assigned yet. Add promoters below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedPromoters.map(promoter => (
                <div
                  key={promoter.id}
                  className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{promoter.fullName}</div>
                    <div className="text-sm text-gray-600">Code: {promoter.uniqueCode}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={promoter.workHours}
                        onChange={(e) => handleWorkHoursChange(promoter.id, parseFloat(e.target.value))}
                        className="w-20 h-8"
                        placeholder="Hours"
                      />
                      <span className="text-xs text-gray-600 mt-1">hours</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="secondary" className="text-xs">
                        {formatCurrency(promoter.estimatedPay)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePromoter(promoter.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Promoters */}
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Available Promoters ({filteredPromoters.length})</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {/* Search */}
          <Input
            placeholder="Search promoters by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Available List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredPromoters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  {availablePromoters.length === 0
                    ? "No approved promoters available"
                    : "All promoters have been assigned"}
                </p>
              </div>
            ) : (
              filteredPromoters.map(promoter => (
                <div
                  key={promoter.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">{promoter.full_name}</div>
                    <div className="text-sm text-gray-600">Code: {promoter.unique_code}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPromoter(promoter)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button onClick={onPrevious} variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Preview
          </Button>
          <Button
            onClick={onNext}
            size="lg"
            className="gap-2"
            disabled={assignedPromoters.length === 0}
          >
            Review & Send Contracts
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
