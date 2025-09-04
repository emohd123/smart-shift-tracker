import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search,
  Calendar,
  Clock,
  Building2,
  User,
  Download,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CertificateVerificationData {
  id: string;
  certificate_uid: string;
  user_id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  total_earnings: number;
  status: string;
  pdf_url?: string;
  is_revoked: boolean;
  created_at: string;
  user: {
    full_name: string;
    nationality?: string;
  };
  tenant: {
    name: string;
  };
}

const CertificateVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [certificateUid, setCertificateUid] = useState(searchParams.get('uid') || '');
  const [certificate, setCertificate] = useState<CertificateVerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerification = async () => {
    if (!certificateUid.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Call the verify-certificate function to log the verification attempt
      const { error: logError } = await supabase.functions.invoke('verify-certificate', {
        body: {
          certificate_uid: certificateUid.trim(),
          ip_address: 'unknown', // In a real app, you might get this from a service
          user_agent: navigator.userAgent,
        },
      });

      if (logError) {
        console.warn('Failed to log certificate verification:', logError);
        // Continue anyway - logging is not critical for verification
      }

      // Fetch certificate data (this uses public RLS policy)
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_uid,
          user_id,
          tenant_id,
          period_start,
          period_end,
          total_hours,
          total_earnings,
          status,
          pdf_url,
          is_revoked,
          created_at,
          user:profiles!user_id(full_name, nationality),
          tenant:tenants!tenant_id(name)
        `)
        .eq('certificate_uid', certificateUid.trim())
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Certificate not found. Please check the Certificate ID and try again.');
        } else {
          setError('Failed to verify certificate. Please try again later.');
          console.error('Verification error:', fetchError);
        }
        setCertificate(null);
        return;
      }

      setCertificate(data);
    } catch (err) {
      console.error('Verification error:', err);
      setError('An unexpected error occurred. Please try again later.');
      setCertificate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (certificate?.pdf_url) {
      window.open(certificate.pdf_url, '_blank');
    }
  };

  // Auto-verify if UID is in URL
  useEffect(() => {
    if (certificateUid && !hasSearched) {
      handleVerification();
    }
  }, [certificateUid]);

  const renderVerificationForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Certificate Verification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Enter a certificate ID to verify its authenticity and view details.
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="certificate_uid">Certificate ID</Label>
          <div className="flex space-x-2">
            <Input
              id="certificate_uid"
              placeholder="Enter certificate ID (e.g., CERT-1234567890-ABC123)"
              value={certificateUid}
              onChange={(e) => setCertificateUid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerification()}
            />
            <Button 
              onClick={handleVerification} 
              disabled={isLoading || !certificateUid.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Certificate verification is public and does not require login. This system maintains 
            a log of verification attempts for security purposes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderVerificationResult = () => {
    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Verification Failed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => {
                setError(null);
                setHasSearched(false);
                setCertificate(null);
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!certificate) {
      return null;
    }

    const isValid = certificate.status === 'approved' && !certificate.is_revoked;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isValid ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span>
              {isValid ? 'Certificate Valid' : 'Certificate Invalid'}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={isValid ? "default" : "destructive"}
              className="text-sm px-4 py-1"
            >
              {isValid ? 'VERIFIED ✓' : 'INVALID ✗'}
            </Badge>
          </div>

          {/* Certificate Holder Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Certificate Holder</h3>
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-lg">{certificate.user.full_name}</div>
                {certificate.user.nationality && (
                  <div className="text-sm text-muted-foreground">
                    Nationality: {certificate.user.nationality}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Work Experience Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Organization</div>
                  <div className="text-muted-foreground">{certificate.tenant.name}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Work Period</div>
                  <div className="text-muted-foreground">
                    {new Date(certificate.period_start).toLocaleDateString()} - {new Date(certificate.period_end).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Total Hours</div>
                  <div className="text-muted-foreground font-semibold">
                    {certificate.total_hours.toFixed(1)} hours
                  </div>
                </div>
              </div>

              {certificate.total_earnings > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 text-muted-foreground font-bold">$</div>
                  <div>
                    <div className="font-medium">Total Earnings</div>
                    <div className="text-muted-foreground font-semibold">
                      ${certificate.total_earnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Certificate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Certificate ID</div>
                <div className="text-muted-foreground font-mono">
                  {certificate.certificate_uid}
                </div>
              </div>
              <div>
                <div className="font-medium">Issue Date</div>
                <div className="text-muted-foreground">
                  {new Date(certificate.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Special Notices */}
          {certificate.is_revoked && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>This certificate has been revoked</strong> and is no longer valid.
              </AlertDescription>
            </Alert>
          )}

          {certificate.status !== 'approved' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This certificate has not been approved and may not be valid.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          {isValid && (
            <div className="flex justify-center space-x-4">
              {certificate.pdf_url && (
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setCertificateUid('');
                  setCertificate(null);
                  setHasSearched(false);
                  setError(null);
                }}
              >
                Verify Another
              </Button>
            </div>
          )}

          {/* Footer Notice */}
          <div className="text-xs text-muted-foreground text-center border-t pt-4">
            <p>
              This verification was performed on {new Date().toLocaleString()}.
            </p>
            <p className="mt-1">
              Certificate verification system powered by Smart Shift Tracker.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Certificate Verification</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of work experience certificates
          </p>
        </div>

        {renderVerificationForm()}
        
        {(certificate || error) && renderVerificationResult()}
      </div>
    </div>
  );
};

export default CertificateVerification;