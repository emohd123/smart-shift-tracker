import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, Eraser, AlertTriangle, Settings } from "lucide-react";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { DataPurgeButton } from "@/components/data/DataPurgeButton";
import { usePromoterDelete } from "@/hooks/promoters/usePromoterDelete";

export default function AdminSystemTab() {
  const { user, isAuthenticated } = useAuth();
  const { deleteAllShifts, refreshShifts } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated,
  });

  const { deleteAllPromoters, isDeleting: isPromoterDeleting } = usePromoterDelete();
  const [isAllPurging, setIsAllPurging] = useState(false);

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
    <div className="space-y-6">
      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>
            Configure platform settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              System configuration options including notification settings, email templates,
              and platform preferences will be available here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Database Management</CardTitle>
          </div>
          <CardDescription>
            Manage platform data and perform maintenance operations
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

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            View system activity and administrative actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              Comprehensive audit logging will track all administrative actions,
              user modifications, and system events.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
