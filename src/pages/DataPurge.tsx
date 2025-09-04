
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPurgeButton } from "@/components/data/DataPurgeButton";
import { Eraser } from "lucide-react";
import { toast } from "sonner";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { usePromoterDelete } from "@/hooks/promoters/usePromoterDelete";

const DataPurge = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [isAllPurging, setIsAllPurging] = useState(false);
  
  // Get shifts data and delete functions
  const { deleteAllShifts, refreshShifts } = useShiftsData({ 
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated 
  });
  
  // Get promoter delete functions
  const { deleteAllPromoters, isDeleting: isPromoterDeleting } = usePromoterDelete();
  
  // Only admins should access this page
  if (!isAuthenticated || user?.role !== UserRole.Admin) {
    return <Navigate to="/shifts" replace />;
  }
  
  const handlePurgeAll = async () => {
    setIsAllPurging(true);
    
    try {
      toast.info("Data Purge Started", {
        description: "Deleting all shifts and promoters data..."
      });
      
      // Delete all shifts first
      await deleteAllShifts();
      
      // Then delete all promoters
      await deleteAllPromoters();
      
      toast.success("Data Purge Complete", {
        description: "All shifts and promoters data has been successfully deleted"
      });
      
      // Refresh shifts list
      refreshShifts();
      
    } catch (error) {
      console.error("Error purging data:", error);
      toast.error("Data Purge Error", {
        description: "There was a problem deleting some of the data. Please try again."
      });
    } finally {
      setIsAllPurging(false);
    }
  };

  return (
    <AppLayout title="Data Management">
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eraser className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl font-bold tracking-tight">Data Purge</CardTitle>
            </div>
            <CardDescription>
              Permanently delete shifts and promoters data from the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg border border-destructive/10">
                <h3 className="text-lg font-medium mb-2">Warning</h3>
                <p className="text-muted-foreground mb-4">
                  The operations on this page will permanently delete data from the database.
                  These actions cannot be undone. Please proceed with caution.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-background">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Shifts Data</CardTitle>
                      <CardDescription>Delete all shift records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DataPurgeButton
                        entity="shifts"
                        onPurge={deleteAllShifts}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Promoters Data</CardTitle>
                      <CardDescription>Delete all promoter records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DataPurgeButton
                        entity="promoters"
                        onPurge={deleteAllPromoters}
                        isDeleting={isPromoterDeleting}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-destructive/5 border-destructive/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-destructive">Complete Purge</CardTitle>
                      <CardDescription>Delete all application data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DataPurgeButton
                        entity="all"
                        onPurge={handlePurgeAll}
                        isDeleting={isAllPurging}
                        variant="destructive"
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DataPurge;
