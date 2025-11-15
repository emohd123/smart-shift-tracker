import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function useCertificatePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const checkPaymentStatus = async (certificateId: string) => {
    if (!user) return false;

    try {
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select('paid, payment_id')
        .eq('id', certificateId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return false;
      }

      return certificate?.paid || false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  const initiateCertificatePayment = async (certificateId: string) => {
    if (!user) {
      toast.error("Please log in to purchase certificates");
      return;
    }

    setIsProcessing(true);

    try {
      // Check if already paid
      const isPaid = await checkPaymentStatus(certificateId);
      if (isPaid) {
        toast.info("This certificate is already paid for");
        setIsProcessing(false);
        return;
      }

      // Call edge function to create checkout session
      const { data, error } = await supabase.functions.invoke(
        'create-certificate-checkout',
        {
          body: { certificateId },
        }
      );

      if (error) {
        throw error;
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    checkPaymentStatus,
    initiateCertificatePayment,
  };
}
