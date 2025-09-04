
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";

type GenerateButtonProps = {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
};

export default function GenerateButton({ onClick, loading, disabled }: GenerateButtonProps) {
  return (
    <Button 
      className="w-full relative overflow-hidden group"
      onClick={onClick}
      disabled={loading || disabled}
    >
      <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Certificate...
        </>
      ) : (
        <>
          <Clock className="mr-2 h-4 w-4" />
          Generate Certificate
        </>
      )}
    </Button>
  );
}
