import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { 
  CertificateRequest, 
  CertificateRequestForm, 
  PaymentFlowState,
  Payment
} from '@/types/payment';

export const useCertificatePayment = () => {
  const { user } = useAuth();
  const { currentTenant } = useCurrentTenant();
  const [flowState, setFlowState] = useState<PaymentFlowState>({
    step: 'form',
    isLoading: false,
  });

  // Create certificate request
  const createCertificateRequest = async (formData: CertificateRequestForm) => {
    if (!user || !currentTenant) {
      throw new Error('User and tenant required');
    }

    setFlowState(prev => ({ ...prev, isLoading: true }));

    try {
      // Calculate hours and earnings for the period
      const { data: hoursData, error: hoursError } = await supabase
        .rpc('calculate_user_hours', {
          p_tenant_id: currentTenant.id,
          p_user_id: user.id,
          p_period_start: formData.period_start,
          p_period_end: formData.period_end,
        });

      if (hoursError) throw hoursError;

      const { data: earningsData, error: earningsError } = await supabase
        .rpc('calculate_user_earnings', {
          p_tenant_id: currentTenant.id,
          p_user_id: user.id,
          p_period_start: formData.period_start,
          p_period_end: formData.period_end,
        });

      if (earningsError) throw earningsError;

      const totalHours = hoursData || 0;
      const totalEarnings = earningsData || 0;

      if (totalHours < 1) {
        throw new Error('You must have at least 1 hour of approved work time in the selected period to request a certificate.');
      }

      // Create the certificate request
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .insert({
          tenant_id: currentTenant.id,
          part_timer_id: user.id,
          period_start: formData.period_start,
          period_end: formData.period_end,
          total_hours: totalHours,
          total_earnings: totalEarnings,
          status: 'draft',
          payment_amount_cents: 500, // $5.00
          currency: 'usd',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      setFlowState(prev => ({
        ...prev,
        step: 'summary',
        certificateRequest: request,
        isLoading: false,
      }));

      return request;
    } catch (error) {
      console.error('Error creating certificate request:', error);
      const message = error instanceof Error ? error.message : 'Failed to create certificate request';
      setFlowState(prev => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      toast.error(message);
      throw error;
    }
  };

  // Create Stripe checkout session
  const createCheckoutSession = async (certificateRequestId: string) => {
    if (!user || !currentTenant) {
      throw new Error('User and tenant required');
    }

    setFlowState(prev => ({ ...prev, isLoading: true }));

    try {
      const baseUrl = window.location.origin;
      
      // Call the Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-certificate-checkout', {
        body: {
          certificate_request_id: certificateRequestId,
          success_url: `${baseUrl}/certificates/payment/success?request_id=${certificateRequestId}`,
          cancel_url: `${baseUrl}/certificates/payment/cancelled?request_id=${certificateRequestId}`,
        },
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error('No checkout URL returned from server');
      }

      // Update request with session ID
      await supabase
        .from('certificate_requests')
        .update({
          stripe_session_id: data.session_id,
          status: 'pending_payment',
        })
        .eq('id', certificateRequestId);

      setFlowState(prev => ({
        ...prev,
        step: 'payment',
        checkoutSession: data,
        isLoading: false,
      }));

      // Redirect to Stripe Checkout
      window.location.href = data.url;

      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      setFlowState(prev => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      toast.error(message);
      throw error;
    }
  };

  // Get certificate request status
  const getCertificateRequest = async (requestId: string): Promise<CertificateRequest | null> => {
    try {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching certificate request:', error);
      return null;
    }
  };

  // Get user's certificate requests
  const getUserCertificateRequests = async (): Promise<CertificateRequest[]> => {
    if (!user || !currentTenant) return [];

    try {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('part_timer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      return [];
    }
  };

  // Get payments for a certificate request
  const getCertificatePayments = async (requestId: string): Promise<Payment[]> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('certificate_request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  };

  // Cancel certificate request
  const cancelCertificateRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('part_timer_id', user?.id) // Ensure user owns the request
        .in('status', ['draft', 'pending_payment']); // Only allow cancellation in these states

      if (error) throw error;

      toast.success('Certificate request cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling certificate request:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel request';
      toast.error(message);
      return false;
    }
  };

  // Reset flow state
  const resetFlow = () => {
    setFlowState({
      step: 'form',
      isLoading: false,
    });
  };

  // Handle payment success (called from success page)
  const handlePaymentSuccess = async (requestId: string) => {
    try {
      const request = await getCertificateRequest(requestId);
      if (!request) {
        throw new Error('Certificate request not found');
      }

      setFlowState({
        step: 'success',
        certificateRequest: request,
        isLoading: false,
      });

      return request;
    } catch (error) {
      console.error('Error handling payment success:', error);
      setFlowState({
        step: 'error',
        error: 'Failed to confirm payment status',
        isLoading: false,
      });
      throw error;
    }
  };

  // Real-time subscription for request updates
  useEffect(() => {
    if (!user || !currentTenant || !flowState.certificateRequest) return;

    const subscription = supabase
      .channel(`certificate_request:${flowState.certificateRequest.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'certificate_requests',
        filter: `id=eq.${flowState.certificateRequest.id}`,
      }, (payload) => {
        const updatedRequest = payload.new as CertificateRequest;
        setFlowState(prev => ({
          ...prev,
          certificateRequest: updatedRequest,
        }));

        // Handle status changes
        if (updatedRequest.status === 'completed') {
          setFlowState(prev => ({ ...prev, step: 'success' }));
          toast.success('Certificate generated successfully!');
        } else if (updatedRequest.status === 'failed') {
          setFlowState(prev => ({ 
            ...prev, 
            step: 'error',
            error: 'Certificate generation failed. Please contact support.',
          }));
          toast.error('Certificate generation failed');
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, currentTenant, flowState.certificateRequest?.id]);

  return {
    flowState,
    createCertificateRequest,
    createCheckoutSession,
    getCertificateRequest,
    getUserCertificateRequests,
    getCertificatePayments,
    cancelCertificateRequest,
    resetFlow,
    handlePaymentSuccess,
  };
};