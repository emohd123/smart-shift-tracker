import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Calendar, Check, X } from "lucide-react";
import { TimePeriod } from "../types/certificate";
import { useShiftData } from "../hooks/useShiftData";

type ShiftSelectorProps = {
  userId: string;
  timePeriod: TimePeriod;
  selectedShifts: string[];
  setSelectedShifts: (shifts: string[]) => void;
  availableShifts?: any[];
};

export function ShiftSelector({ 
  userId, 
  timePeriod, 
  selectedShifts, 
  setSelectedShifts,
  availableShifts = []
}: ShiftSelectorProps) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchCompletedShifts } = useShiftData();

  useEffect(() => {
    if (userId && timePeriod) {
      loadShifts();
    }
  }, [userId, timePeriod]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const { shifts: fetchedShifts } = await fetchCompletedShifts(userId, timePeriod);
      setShifts(fetchedShifts || []);
    } catch (error) {
      console.error("Failed to load shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleShift = (shiftId: string) => {
    setSelectedShifts(
      selectedShifts.includes(shiftId)
        ? selectedShifts.filter(id => id !== shiftId)
        : [...selectedShifts, shiftId]
    );
  };

  const selectAll = () => {
    setSelectedShifts(shifts.map(shift => shift.id || shift.date));
  };

  const clearAll = () => {
    setSelectedShifts([]);
  };

  const totalSelectedHours = shifts
    .filter(shift => selectedShifts.includes(shift.id || shift.date))
    .reduce((sum, shift) => sum + (shift.hours || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Work History</CardTitle>
          <CardDescription>Loading available shifts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Select Work History
            </CardTitle>
            <CardDescription>
              Choose specific shifts to include in your certificate
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={selectAll} 
              variant="outline" 
              size="sm"
              disabled={shifts.length === 0}
            >
              Select All
            </Button>
            <Button 
              onClick={clearAll} 
              variant="outline" 
              size="sm"
              disabled={selectedShifts.length === 0}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        
        {selectedShifts.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg">
            <Badge variant="secondary">
              {selectedShifts.length} shift{selectedShifts.length !== 1 ? 's' : ''} selected
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {totalSelectedHours.toFixed(1)} total hours
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No shifts found</p>
            <p className="text-sm">No completed shifts found for the selected time period.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {shifts.map((shift, index) => {
              const shiftId = shift.id || shift.date;
              const isSelected = selectedShifts.includes(shiftId);
              
              return (
                <div
                  key={shiftId}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-secondary/30 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border bg-background'
                  }`}
                  onClick={() => toggleShift(shiftId)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleShift(shiftId)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Label className="text-sm font-medium cursor-pointer">
                            {shift.title}
                          </Label>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {shift.date}
                            </span>
                            {shift.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {shift.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {shift.hours || 0} hours
                            </span>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={isSelected ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {shift.hours || 0}h
                        </Badge>
                      </div>
                      
                      {shift.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {shift.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}