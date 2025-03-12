import { useState } from "react";
import ShiftCard, { Shift } from "./ShiftCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ShiftStatus } from "@/types/database";

type ShiftListProps = {
  shifts: Shift[];
  title?: string;
};

export default function ShiftList({ shifts, title = "Shifts" }: ShiftListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter shifts based on search term and status filter
  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          shift.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || shift.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        
        {user?.role === "admin" && (
          <Button onClick={() => navigate("/shifts/new")} size="sm" className="h-9">
            <Plus size={16} className="mr-1" />
            New Shift
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shifts..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-[180px] flex items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="Filter status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={ShiftStatus.Upcoming}>Upcoming</SelectItem>
              <SelectItem value={ShiftStatus.Ongoing}>Ongoing</SelectItem>
              <SelectItem value={ShiftStatus.Completed}>Completed</SelectItem>
              <SelectItem value={ShiftStatus.Cancelled}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredShifts.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}>
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onClick={() => navigate(`/shifts/${shift.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No shifts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
