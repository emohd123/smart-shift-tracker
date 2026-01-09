import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProfileChangeRequest {
  id: string;
  user_id: string;
  requested_by: string;
  request_type: string;
  field_name: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  requested_by_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export function ProfileChangeRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile_change_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_change_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as ProfileChangeRequest;
            setRequests(prev => [newRequest, ...prev]);
            toast.info('New profile change request received', {
              description: newRequest.message
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as ProfileChangeRequest;
            setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          requested_by_profile:profiles!profile_change_requests_requested_by_fkey(full_name, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST116' || error.code === '42P01') {
          setRequests([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      setRequests((data || []) as ProfileChangeRequest[]);
    } catch (error) {
      console.error('Error fetching change requests:', error);
      toast.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'in_progress' | 'resolved' | 'dismissed') => {
    try {
      setUpdating(requestId);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profile_change_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request marked as ${newStatus.replace('_', ' ')}`);
      await fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const getFieldLabel = (fieldName: string) => {
    const fieldMap: Record<string, string> = {
      'id_card': 'ID Card',
      'profile_photo': 'Profile Photo',
      'logo': 'Company Logo',
      'cr_document': 'Commercial Registration',
      'business_certificate': 'Business Certificate',
      'full_name': 'Full Name',
      'company_name': 'Company Name',
      'phone_number': 'Phone Number',
      'email': 'Email',
      'nationality': 'Nationality',
      'address': 'Address',
      'bank_details': 'Bank Details',
      'registration_id': 'Registration ID',
      'industry': 'Industry',
      'website': 'Website',
    };
    return fieldMap[fieldName] || fieldName;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const resolvedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'dismissed');

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show anything if no requests
  }

  return (
    <div className="space-y-4">
      {/* Alert Banner for Pending Requests */}
      {pendingRequests.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            You have {pendingRequests.length} pending profile change request{pendingRequests.length > 1 ? 's' : ''}. 
            Please review and update your profile accordingly.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Change Requests</CardTitle>
          <CardDescription>
            Admin requests for profile updates. Please address these requests to maintain your account in good standing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pending Requests */}
          {pendingRequests.length > 0 ? (
            <div className="space-y-4 mb-6">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={request.status === 'pending' ? 'destructive' : 'default'}>
                          {request.status === 'pending' ? 'Pending' : 'In Progress'}
                        </Badge>
                        <span className="font-medium">{getFieldLabel(request.field_name)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({request.request_type.replace('_', ' ')})
                        </span>
                      </div>
                      <p className="text-sm mb-3">{request.message}</p>
                      <div className="text-xs text-muted-foreground">
                        Requested: {formatDate(request.created_at)}
                        {request.requested_by_profile && (
                          <span> • By: {request.requested_by_profile.full_name || 'Admin'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'in_progress')}
                        disabled={updating === request.id}
                      >
                        {updating === request.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Mark as In Progress
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, 'resolved')}
                      disabled={updating === request.id}
                    >
                      {updating === request.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground mb-6">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pending requests</p>
            </div>
          )}

          {/* Resolved Requests */}
          {resolvedRequests.length > 0 && (
            <Collapsible open={showResolved} onOpenChange={setShowResolved}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>Resolved Requests ({resolvedRequests.length})</span>
                  <span>{showResolved ? '−' : '+'}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-4">
                  {resolvedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 opacity-75">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">
                              {request.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                            </Badge>
                            <span className="text-sm font-medium">{getFieldLabel(request.field_name)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
                          <div className="text-xs text-muted-foreground">
                            {request.resolved_at && `Resolved: ${formatDate(request.resolved_at)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
