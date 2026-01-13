import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBHD } from "@/components/shifts/utils/paymentCalculations";

interface ProcessPaymentData {
  assignmentId: string;
  amount: number;
  transactionReference: string;
  paymentDate: string;
  notes?: string;
}

export function usePaymentProcessing() {
  const [processing, setProcessing] = useState(false);

  const processPayment = async (data: ProcessPaymentData) => {
    setProcessing(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in");
      }

      // Get assignment details with shift and promoter info
      const { data: assignment, error: assignmentError } = await supabase
        .from('shift_assignments')
        .select(`
          id,
          promoter_id,
          shift_id,
          shifts!inner(
            id,
            company_id,
            title,
            pay_rate,
            pay_rate_type
          )
        `)
        .eq('id', data.assignmentId)
        .single();

      if (assignmentError || !assignment) {
        throw new Error("Assignment not found");
      }

      const shift = Array.isArray(assignment.shifts) ? assignment.shifts[0] : assignment.shifts;
      if (!shift) {
        throw new Error("Shift not found");
      }

      // Verify company owns this shift
      if (shift.company_id !== user.id) {
        // Check if user is admin
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (userRole?.role !== 'admin' && userRole?.role !== 'super_admin') {
          throw new Error("You don't have permission to process this payment");
        }
      }

      // Get promoter bank details
      const { data: promoterProfile, error: promoterError } = await supabase
        .from('profiles')
        .select('iban_number, bank_name, bank_account_holder_name, full_name')
        .eq('id', assignment.promoter_id)
        .single();

      if (promoterError) {
        console.error("Error fetching promoter profile:", promoterError);
        // Continue anyway - bank details might not be required for manual payments
      }

      // Validate payment amount
      if (data.amount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }

      // Validate transaction reference
      if (!data.transactionReference || data.transactionReference.trim().length === 0) {
        throw new Error("Transaction reference is required");
      }

      // Update payment status to 'paid'
      const { error: paymentStatusError } = await supabase
        .from('shift_assignment_payment_status')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: user.id,
          amount: data.amount,
          transaction_reference: data.transactionReference.trim(),
          payment_method: 'bank_transfer',
          payment_processed_at: new Date().toISOString()
        })
        .eq('assignment_id', data.assignmentId);

      if (paymentStatusError) {
        // If payment status doesn't exist, create it
        if (paymentStatusError.code === 'PGRST116') {
          const { error: createError } = await supabase
            .from('shift_assignment_payment_status')
            .insert({
              assignment_id: data.assignmentId,
              status: 'paid',
              paid_at: new Date().toISOString(),
              paid_by: user.id,
              amount: data.amount,
              transaction_reference: data.transactionReference.trim(),
              payment_method: 'bank_transfer',
              payment_processed_at: new Date().toISOString()
            });

          if (createError) throw createError;
        } else {
          throw paymentStatusError;
        }
      }

      // Generate receipt number via RPC
      const { data: receiptNumber, error: receiptNumberError } = await supabase
        .rpc('generate_receipt_number');

      if (receiptNumberError || !receiptNumber) {
        console.error("Receipt number generation error:", receiptNumberError);
        throw new Error("Failed to generate receipt number");
      }

      // Create receipt record
      const { data: receipt, error: receiptError } = await supabase
        .from('payment_receipts')
        .insert({
          assignment_id: data.assignmentId,
          receipt_number: receiptNumber,
          amount: data.amount,
          currency: 'BHD',
          payment_method: 'bank_transfer',
          transaction_reference: data.transactionReference.trim(),
          bank_transfer_date: data.paymentDate,
          iban_number: promoterProfile?.iban_number || null,
          bank_name: promoterProfile?.bank_name || null,
          company_id: shift.company_id,
          promoter_id: assignment.promoter_id,
          shift_id: assignment.shift_id,
          status: 'issued',
          notes: data.notes?.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (receiptError) {
        throw receiptError;
      }

      // Update payment status with receipt_id
      await supabase
        .from('shift_assignment_payment_status')
        .update({ receipt_id: receipt.id })
        .eq('assignment_id', data.assignmentId);

      // Trigger PDF generation (async, don't wait)
      supabase.functions.invoke('generate-payment-receipt', {
        body: { receipt_id: receipt.id }
      }).catch((error) => {
        console.error("Error triggering PDF generation:", error);
        // Don't fail the payment if PDF generation fails
      });

      // Send notification to promoter
      await supabase
        .from('notifications')
        .insert({
          user_id: assignment.promoter_id,
          title: 'Payment Received',
          message: `Payment of ${formatBHD(data.amount)} has been processed for ${shift.title}`,
          type: 'success',
          data: {
            link: `/payments/receipts/${receipt.id}`,
            receipt_id: receipt.id,
            amount: data.amount
          }
        });

      toast.success("Payment processed successfully!");
      return receipt;

    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast.error(error.message || "Failed to process payment");
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  return { processPayment, processing };
}
