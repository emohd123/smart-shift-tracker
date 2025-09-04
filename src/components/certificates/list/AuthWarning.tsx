
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthWarning() {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>
        You need to be logged in to view and download your certificates.
      </AlertDescription>
    </Alert>
  );
}
