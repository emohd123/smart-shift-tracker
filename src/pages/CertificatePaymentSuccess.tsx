import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { useCertificatePayment } from '@/hooks/useCertificatePayment';
import { getCertificateRequestStatusInfo } from '@/lib/stripe';
import type { CertificateRequest } from '@/types/payment';

const CertificatePaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getCertificateRequest, handlePaymentSuccess } = useCertificatePayment();
  
  const [request, setRequest] = useState<CertificateRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = searchParams.get('request_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const loadPaymentResult = async () => {
      if (!requestId) {
        setError('Missing request ID in URL');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get the certificate request
        const certRequest = await getCertificateRequest(requestId);
        
        if (!certRequest) {
          setError('Certificate request not found');
          return;
        }

        setRequest(certRequest);

        // If payment was successful, handle success flow
        if (certRequest.status === 'paid' || certRequest.status === 'processing' || certRequest.status === 'completed') {
          await handlePaymentSuccess(requestId);
        } else if (certRequest.status === 'pending_payment') {
          // Payment might still be processing
          setError('Payment is still being processed. Please wait a moment and refresh the page.');
        } else {
          setError(`Payment was not successful. Status: ${certRequest.status}`);
        }
      } catch (err) {
        console.error('Error loading payment result:', err);
        setError(err instanceof Error ? err.message : 'Failed to load payment result');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentResult();

    // Poll for updates if status is processing
    const pollInterval = setInterval(async () => {
      if (requestId && request?.status === 'processing') {
        try {
          const updated = await getCertificateRequest(requestId);
          if (updated && updated.status !== request.status) {
            setRequest(updated);
            if (updated.status === 'completed' || updated.status === 'failed') {
              clearInterval(pollInterval);
            }
          }
        } catch (err) {
          console.error('Error polling for updates:', err);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [requestId, sessionId, request?.status]);

  const handleDownloadCertificate = async () => {
    // This would implement certificate download
    // For now, navigate to certificates page
    navigate('/certificates');
  };

  const handleViewCertificates = () => {
    navigate('/certificates');
  };

  const handleRequestAnother = () => {
    navigate('/certificates/request');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <h2 className="text-xl font-semibold">Processing Payment Result</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment and generate your certificate...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Payment Issue</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/certificates')}>
                Back to Certificates
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Certificate Request Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find the certificate request you're looking for.
            </p>
            <Button onClick={() => navigate('/certificates')}>
              Back to Certificates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getCertificateRequestStatusInfo(request.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Payment Successful!</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Thank you for your payment!
            </h2>
            <p className="text-muted-foreground">
              Your work experience certificate is being generated.
            </p>
          </div>

          {/* Request Details */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold">Certificate Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Work Period</div>
                <div className="text-muted-foreground">
                  {new Date(request.period_start).toLocaleDateString()} - {new Date(request.period_end).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="font-medium">Total Hours</div>
                <div className="text-muted-foreground">
                  {request.total_hours?.toFixed(1) || '0'} hours
                </div>
              </div>
              {request.total_earnings && request.total_earnings > 0 && (
                <div>
                  <div className="font-medium">Total Earnings</div>
                  <div className="text-muted-foreground">
                    ${request.total_earnings.toFixed(2)}
                  </div>
                </div>
              )}
              <div>
                <div className="font-medium">Certificate Fee</div>
                <div className="text-muted-foreground">
                  ${(request.payment_amount_cents / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <Alert>
            <div className="flex items-center space-x-2">
              {request.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
              {request.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {request.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
              <span className="font-medium">Status: {statusInfo.label}</span>
            </div>
            <AlertDescription className="mt-2">
              {statusInfo.description}
              {request.status === 'processing' && (
                <div className="mt-2 text-sm">
                  <strong>Estimated time:</strong> 1-2 minutes. You'll be notified when your certificate is ready.
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {request.status === 'completed' ? (
              <>
                <Button onClick={handleDownloadCertificate} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" onClick={handleViewCertificates} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Certificates
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleViewCertificates} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
                <Button onClick={handleRequestAnother} className="flex-1">
                  Request Another Certificate
                </Button>
              </>
            )}
          </div>

          {/* Receipt Information */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>A receipt has been sent to your email address.</p>
            <p className="mt-1">
              Transaction ID: {request.stripe_payment_intent_id?.substring(0, 20)}...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificatePaymentSuccess;