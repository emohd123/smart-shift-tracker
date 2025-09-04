import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useCertificatePayment } from '@/hooks/useCertificatePayment';
import { formatCentsToDollars } from '@/lib/stripe';
import { CERTIFICATE_PRICE_CENTS } from '@/types/payment';

const CertificateRequestFlow: React.FC = () => {
  const {
    flowState,
    createCertificateRequest,
    createCheckoutSession,
    resetFlow
  } = useCertificatePayment();

  const [formData, setFormData] = useState({
    period_start: '',
    period_end: ''
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.period_start || !formData.period_end) {
      return;
    }

    if (new Date(formData.period_start) >= new Date(formData.period_end)) {
      return;
    }

    try {
      await createCertificateRequest(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleProceedToPayment = async () => {
    if (!flowState.certificateRequest) return;
    
    try {
      await createCheckoutSession(flowState.certificateRequest.id);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const renderFormStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Request Work Certificate</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_start">Period Start Date</Label>
              <Input
                id="period_start"
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  period_start: e.target.value 
                }))}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="period_end">Period End Date</Label>
              <Input
                id="period_end"
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  period_end: e.target.value 
                }))}
                required
                min={formData.period_start}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              We'll calculate your approved work hours for this period. You need at least 1 hour of approved time to generate a certificate.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              Certificate Fee: <span className="font-semibold">{formatCentsToDollars(CERTIFICATE_PRICE_CENTS)}</span>
            </div>
            <Button 
              type="submit" 
              disabled={flowState.isLoading}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>{flowState.isLoading ? 'Processing...' : 'Continue'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderSummaryStep = () => {
    if (!flowState.certificateRequest) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Certificate Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Information */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">Work Period</h3>
            <div className="flex items-center justify-between">
              <span>{new Date(flowState.certificateRequest.period_start).toLocaleDateString()}</span>
              <span className="text-muted-foreground">to</span>
              <span>{new Date(flowState.certificateRequest.period_end).toLocaleDateString()}</span>
            </div>
          </div>

          <Separator />

          {/* Work Summary */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Work Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Total Hours</span>
                </div>
                <Badge variant="outline" className="font-semibold">
                  {flowState.certificateRequest.total_hours?.toFixed(1) || '0'} hrs
                </Badge>
              </div>

              {flowState.certificateRequest.total_earnings && flowState.certificateRequest.total_earnings > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Total Earnings</span>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    ${flowState.certificateRequest.total_earnings.toFixed(2)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">Payment</h3>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Certificate Fee</span>
              <span>{formatCentsToDollars(flowState.certificateRequest.payment_amount_cents)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              One-time fee for official work experience certificate
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={resetFlow}
              disabled={flowState.isLoading}
            >
              Back
            </Button>
            <Button 
              onClick={handleProceedToPayment}
              disabled={flowState.isLoading}
              className="flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>{flowState.isLoading ? 'Processing...' : 'Pay & Generate Certificate'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Processing Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          Redirecting to secure payment checkout...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          If you're not redirected automatically, please check your pop-up blocker.
        </p>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Certificate Generated Successfully</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Payment Successful!</h3>
          <p className="text-muted-foreground">
            Your work experience certificate has been generated and is ready for download.
          </p>
        </div>

        {flowState.certificateRequest && (
          <div className="text-sm text-muted-foreground">
            Certificate ID: {flowState.certificateRequest.id}
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={resetFlow}>
            Generate Another
          </Button>
          <Button onClick={() => window.location.href = '/certificates'}>
            View Certificates
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderErrorStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span>Error</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-muted-foreground">
            {flowState.error || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={resetFlow}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/certificates'}>
            Back to Certificates
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render based on current step
  switch (flowState.step) {
    case 'form':
      return renderFormStep();
    case 'summary':
      return renderSummaryStep();
    case 'payment':
      return renderPaymentStep();
    case 'success':
      return renderSuccessStep();
    case 'error':
      return renderErrorStep();
    default:
      return renderFormStep();
  }
};

export default CertificateRequestFlow;