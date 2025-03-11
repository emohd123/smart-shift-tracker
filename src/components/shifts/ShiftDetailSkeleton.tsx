
import { Skeleton } from "@/components/ui/skeleton";

export function ShiftDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
