import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingDisplayProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const RatingDisplay = ({
  rating,
  size = "md",
  showValue = false,
  className,
}: RatingDisplayProps) => {
  const starSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  // Generate 5 stars based on rating
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starIndex = index + 1;
    const isFilled = starIndex <= Math.round(rating);

    return (
      <Star
        key={index}
        className={cn(
          starSize,
          isFilled
            ? "fill-yellow-400 text-yellow-400"
            : "fill-transparent text-gray-300"
        )}
      />
    );
  });

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars}
      {showValue && (
        <span className={cn("ml-1 font-medium text-muted-foreground", textSize)}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
