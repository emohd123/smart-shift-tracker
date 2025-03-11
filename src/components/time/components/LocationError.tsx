
import { AlertCircle } from "lucide-react";

export default function LocationError() {
  return (
    <div className="w-full bg-destructive/10 text-destructive rounded-md p-3 text-sm flex items-start">
      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">Wrong Location</p>
        <p className="text-xs mt-1">You must be physically present at the shift location to check in.</p>
      </div>
    </div>
  );
}
