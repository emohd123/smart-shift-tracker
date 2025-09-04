import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
};

interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  showSpinner = true,
  className
}) => (
  <div className={cn("flex flex-col items-center justify-center py-8 space-y-3", className)}>
    {showSpinner && <LoadingSpinner size="lg" />}
    <p className="text-muted-foreground animate-pulse">{message}</p>
  </div>
);

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  count = 1, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border rounded-lg p-6 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className
}) => (
  <div className={cn("space-y-3", className)}>
    {/* Header */}
    <div className="grid grid-cols-4 gap-4 p-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  fallback
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      {loading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {error ? (
        fallback || <div className="flex items-center justify-center bg-muted text-muted-foreground p-4">Failed to load image</div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className={cn(
            "transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100",
            className
          )}
        />
      )}
    </div>
  );
};