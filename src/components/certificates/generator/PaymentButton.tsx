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
      className="w-full sm:w-auto relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      onClick={onClick}
      disabled={isProcessing}
    >
      <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Processing Payment...</span>
          <span className="sm:hidden">Processing...</span>
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Pay $4.99 to Download</span>
          <span className="sm:hidden">Pay $4.99</span>
        </>
      )}
    </Button>
  );
}
