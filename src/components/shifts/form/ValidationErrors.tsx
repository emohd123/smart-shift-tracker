
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationErrorsProps {
  errors: string[];
}

export default function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;
  
  return (
    <Alert variant="destructive">
      <AlertTitle>Validation Error</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
