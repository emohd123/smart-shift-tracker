import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Database, Trash2, AlertTriangle, Settings } from "lucide-react";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSystemTab() {
  const { user, isAuthenticated } = useAuth();
  const { deleteAllShifts, refreshShifts } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated,
  });

  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteShifts = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAllShifts();
      toast.success("All shifts deleted");
      setConfirmText("");
      refreshShifts();
    } catch (error) {
      console.error("Error deleting shifts:", error);
      toast.error("Failed to delete shifts");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePromoters = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("role", "promoter");

      if (error) throw error;

      toast.success("All promoter records deleted");
      setConfirmText("");
    } catch (error) {
      console.error("Error deleting promoters:", error);
      toast.error("Failed to delete promoters");
    } finally {
      setIsDeleting(false);
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
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Data deletion operations are permanent and cannot be undone.
              Always export data before performing delete operations.
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Delete Shifts */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete All Shifts
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete all shift records from the database
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete All Shifts
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action cannot be undone. This will permanently delete all shifts
                      and associated time logs from the database.
                    </p>
                    <div className="space-y-2">
                      <p className="font-semibold">Type DELETE to confirm:</p>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteShifts}
                    disabled={confirmText !== "DELETE" || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete All Shifts"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          {/* Delete Promoters */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete All Promoters
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete all promoter profiles from the database
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete All Promoters
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action cannot be undone. This will permanently delete all promoter
                      profiles and their associated data from the database.
                    </p>
                    <div className="space-y-2">
                      <p className="font-semibold">Type DELETE to confirm:</p>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePromoters}
                    disabled={confirmText !== "DELETE" || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete All Promoters"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
