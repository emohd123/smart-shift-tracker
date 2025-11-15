import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

type PaymentButtonProps = {
  onClick: () => void;
  isProcessing: boolean;
  certificateGenerated: boolean;
};

export default function PaymentButton({ 
  onClick, 
  isProcessing, 
  certificateGenerated 
}: PaymentButtonProps) {
  if (!certificateGenerated) {
    return null;
  }

  return (
    <Button 
      size="lg"
      className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all"
      onClick={onClick}
      disabled={isProcessing}
    >
      <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay $4.99 to Download</span>
          </>
        )}
      </span>
    </Button>
  );
}
