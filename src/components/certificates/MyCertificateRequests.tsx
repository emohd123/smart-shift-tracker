import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useCertificatePayment } from '@/hooks/useCertificatePayment';
import { getCertificateRequestStatusInfo, formatCentsToDollars } from '@/lib/stripe';
import type { CertificateRequest } from '@/types/payment';

const MyCertificateRequests: React.FC = () => {
  const { getUserCertificateRequests, cancelCertificateRequest } = useCertificatePayment();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserCertificateRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading certificate requests:', err);
      setError('Failed to load certificate requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    const success = await cancelCertificateRequest(requestId);
    if (success) {
      await loadRequests(); // Refresh the list
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
      case 'paid':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending_payment':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canCancel = (request: CertificateRequest) => {
    return ['draft', 'pending_payment'].includes(request.status);
  };

  const canDownload = (request: CertificateRequest) => {
    return request.status === 'completed';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading certificate requests...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Certificate Requests</h3>
          <p className="text-muted-foreground mb-4">
            You haven't requested any work experience certificates yet.
          </p>
          <Button onClick={() => window.location.href = '/certificates'}>
            Request Your First Certificate
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Certificate Requests</h2>
        <Button 
          variant="outline" 
          onClick={loadRequests}
          size="sm"
        >
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => {
          const statusInfo = getCertificateRequestStatusInfo(request.status);
          
          return (
            <Card key={request.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Work Certificate</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <Badge 
                      variant="outline" 
                      className={getStatusBadgeColor(request.status)}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {statusInfo.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Period and Work Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Period</div>
                      <div className="text-muted-foreground">
                        {new Date(request.period_start).toLocaleDateString()} - {new Date(request.period_end).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Hours Worked</div>
                      <div className="text-muted-foreground">
                        {request.total_hours?.toFixed(1) || '0'} hours
                      </div>
                    </div>
                  </div>
                  
                  {request.total_earnings && request.total_earnings > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="font-medium">Total Earnings</div>
                        <div className="text-muted-foreground">
                          ${request.total_earnings.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Information */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium">Certificate Fee</div>
                    <div className="text-muted-foreground">
                      {formatCentsToDollars(request.payment_amount_cents)}
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="font-medium">Requested</div>
                    <div className="text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-muted-foreground">
                    ID: {request.id.substring(0, 8)}...
                  </div>
                  
                  <div className="flex space-x-2">
                    {canDownload(request) && (
                      <>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    
                    {request.status === 'pending_payment' && (
                      <Button size="sm" variant="default">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Complete Payment
                      </Button>
                    )}
                    
                    {canCancel(request) && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleCancel(request.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Special messages based on status */}
                {request.status === 'failed' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Certificate generation failed. Please contact support if this issue persists.
                    </AlertDescription>
                  </Alert>
                )}

                {request.status === 'pending_payment' && (
                  <Alert>
                    <CreditCard className="h-4 w-4" />
                    <AlertDescription>
                      Complete your payment to generate the certificate. The checkout session will expire if not completed soon.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyCertificateRequests;