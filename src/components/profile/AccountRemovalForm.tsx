
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountRemovalForm() {
  const { deactivateAccount, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [removalType, setRemovalType] = useState<"deactivate" | "delete" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveAccount = async () => {
    if (!removalType) {
      setError("Please select an account removal option");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (removalType === "deactivate") {
        await deactivateAccount();
        toast({
          title: "Account Deactivated",
          description: "Your account has been temporarily deactivated"
        });
      } else if (removalType === "delete") {
        await deleteAccount();
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted"
        });
      }
    } catch (error: any) {
      console.error("Account removal error:", error);
      setError(error.message || "Failed to process your request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Remove Account</CardTitle>
        <CardDescription>
          Temporarily deactivate or permanently delete your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="removalType">Removal Type</Label>
            <Select 
              value={removalType} 
              onValueChange={(value: "deactivate" | "delete" | "") => setRemovalType(value)}
            >
              <SelectTrigger id="removalType">
                <SelectValue placeholder="Select removal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deactivate">Temporarily Deactivate</SelectItem>
                <SelectItem value="delete">Permanently Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={!removalType || loading}
              >
                {loading ? "Processing..." : "Remove Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {removalType === "deactivate" 
                    ? "Temporarily Deactivate Account" 
                    : "Permanently Delete Account"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {removalType === "deactivate"
                    ? "Your account will be deactivated. You can reactivate it by logging in again."
                    : "This action cannot be undone. Your account and all associated data will be permanently deleted."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveAccount}>
                  {removalType === "deactivate" ? "Deactivate" : "Delete Permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
