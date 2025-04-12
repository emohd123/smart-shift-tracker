
import { TableRowSkeleton } from "@/components/ui/skeleton-loader";

interface PromoterTableSkeletonProps {
  count?: number;
}

export function PromoterTableSkeleton({ count = 5 }: PromoterTableSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <TableRowSkeleton key={index} />
      ))}
    </div>
  );
}
