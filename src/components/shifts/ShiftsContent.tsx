
import { useEffect, useState, useMemo } from "react";
import { Shift } from "./types/ShiftTypes";
import ShiftList from "./ShiftList";
import { ShiftsLoading } from "./ShiftsLoading";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, RefreshCw, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAdminLike } from "@/utils/roleUtils";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEffectiveStatus } from "./utils/statusCalculations";
import { ShiftStatus } from "@/types/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

// Define global functions for TypeScript
declare global {
  interface Window {
    deleteShift?: (id: string) => void;
    deleteAllShifts?: () => void;
    startTimeTracking?: (shift: Shift) => void;
    addShift?: (shift: Shift) => void;
    refreshShifts?: () => void;
  }
}

interface ShiftsContentProps {
  shifts: Shift[];
  loading: boolean;
  title: string;
  deleteShift: (id: string) => void;
  deleteAllShifts?: () => Promise<void>;
  refreshShifts?: () => Promise<void>;
}

interface CompanyOption {
  id: string;
  name: string;
}

export const ShiftsContent = ({
  shifts,
  loading,
  title,
  deleteShift,
  deleteAllShifts,
  refreshShifts
}: ShiftsContentProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminLike(user?.role);
  const isCompany = user?.role === "company";
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Fetch companies for admin filter
  useEffect(() => {
    if (!isAdmin) return;

    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const { data, error } = await supabase
          .from('company_profiles')
          .select('user_id, name')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching companies:', error);
          toast.error('Failed to load companies');
        } else if (data) {
          setCompanies(data.map(c => ({ id: c.user_id, name: c.name })));
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [isAdmin]);

  // Filter shifts by company if admin selected a company
  const filteredShifts = useMemo(() => {
    if (!isAdmin || selectedCompanyId === "all") {
      return shifts;
    }
    return shifts.filter(shift => shift.companyId === selectedCompanyId);
  }, [shifts, isAdmin, selectedCompanyId]);

  // Group shifts by status
  const shiftsByStatus = useMemo(() => {
    const grouped = {
      current: [] as Shift[],
      completed: [] as Shift[],
      upcoming: [] as Shift[],
      all: filteredShifts
    };

    filteredShifts.forEach(shift => {
      const status = getEffectiveStatus(shift);
      if (status === ShiftStatus.Ongoing) {
        grouped.current.push(shift);
      } else if (status === ShiftStatus.Completed) {
        grouped.completed.push(shift);
      } else if (status === ShiftStatus.Upcoming) {
        grouped.upcoming.push(shift);
      }
    });

    return grouped;
  }, [filteredShifts]);

  const currentShifts = shiftsByStatus.current;
  const completedShifts = shiftsByStatus.completed;
  const upcomingShifts = shiftsByStatus.upcoming;

  // Get shifts for active tab
  const getShiftsForTab = () => {
    switch (activeTab) {
      case "current":
        return currentShifts;
      case "completed":
        return completedShifts;
      case "upcoming":
        return upcomingShifts;
      default:
        return shifts;
    }
  };

  // Register the deleteShift function globally, but clean up on unmount
  useEffect(() => {

    window.deleteShift = deleteShift;

    if (deleteAllShifts) {
      window.deleteAllShifts = deleteAllShifts;
    }

    return () => {
      window.deleteShift = undefined;
      window.deleteAllShifts = undefined;
    };
  }, [deleteShift, deleteAllShifts]);

  const handleRefresh = async () => {
    if (refreshShifts) {
      try {
        toast.info("Refreshing shifts data...");
        await refreshShifts();
        toast.success("Data refreshed successfully");
      } catch (error) {
        toast.error("Failed to refresh data");
      }
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllShifts) {
      try {
        toast.info("Deleting all shifts...");
        await deleteAllShifts();
        toast.success("All shifts deleted successfully");
      } catch (error) {
        toast.error("Failed to delete shifts");
      }
    }
  };

  if (loading) {
    return <ShiftsLoading />;
  }

  if (shifts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="bg-secondary/50 p-6 rounded-full mb-6">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No shifts found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          When shifts are created, they will appear here. You can create a new shift using the button below.
        </p>
        <div className="flex gap-4">
          {(isAdmin || isCompany) && (
            <Button
              onClick={() => navigate("/shifts/create")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Create New Shift
            </Button>
          )}

          {refreshShifts && (
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Company Filter for Admins */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Filter by Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedCompanyId} 
              onValueChange={setSelectedCompanyId}
              disabled={loadingCompanies}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "All Companies"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCompanyId !== "all" && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing shifts for: {companies.find(c => c.id === selectedCompanyId)?.name || "Unknown Company"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredShifts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{currentShifts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{completedShifts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingShifts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({filteredShifts.length})</TabsTrigger>
          <TabsTrigger value="current">Current ({currentShifts.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedShifts.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingShifts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <ShiftList
            shifts={getShiftsForTab()}
            title={title}
            deleteShift={deleteShift}
            refreshShifts={refreshShifts}
            deleteAllShifts={isAdmin ? deleteAllShifts : undefined}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
