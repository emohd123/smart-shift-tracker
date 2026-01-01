import { Star } from "lucide-react";
import { usePromoterRating } from "@/hooks/ratings/usePromoterRating";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type PromoterRatingBadgeProps = {
  promoterId: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: { star: "h-3 w-3", text: "text-xs" },
  md: { star: "h-4 w-4", text: "text-sm" },
  lg: { star: "h-5 w-5", text: "text-base" },
};

export const PromoterRatingBadge = ({
  promoterId,
  size = "md",
  showCount = true,
  className,
}: PromoterRatingBadgeProps) => {
  const { averageRating, totalRatings, loading } = usePromoterRating(promoterId);
  const { star, text } = sizeClasses[size];

  if (loading) {
    return <Skeleton className="h-5 w-16" />;
  }

  if (averageRating === null) {
    return (
      <div className={cn("flex items-center gap-1 text-muted-foreground", text, className)}>
        <Star className={cn(star, "text-gray-300")} />
        <span>No ratings</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star className={cn(star, "fill-yellow-400 text-yellow-400")} />
      <span className={cn("font-medium", text)}>{averageRating.toFixed(1)}</span>
      {showCount && (
        <span className={cn("text-muted-foreground", text)}>
          ({totalRatings})
        </span>
      )}
    </div>
  );
};
