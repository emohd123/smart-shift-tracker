
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const ShiftDetailSkeleton = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-8 w-24 mb-4" />
      
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          
          <Skeleton className="h-24 w-full" />
        </CardContent>
        
        <CardFooter>
          <Skeleton className="h-10 w-32 ml-auto" />
        </CardFooter>
      </Card>
      
      <div className="mt-8">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
};
