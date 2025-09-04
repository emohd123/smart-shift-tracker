
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

type EmptyCertificatesProps = {
  searchTerm: string;
  onClearSearch: () => void;
};

export default function EmptyCertificates({ searchTerm, onClearSearch }: EmptyCertificatesProps) {
  return (
    <div className="text-center py-12 border rounded-lg bg-secondary/10">
      <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No certificates found</h3>
      <p className="text-muted-foreground mt-2">
        {searchTerm ? "Try a different search term" : "Generate your first certificate to see it here"}
      </p>
      {searchTerm && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={onClearSearch}
        >
          Clear Search
        </Button>
      )}
    </div>
  );
}
