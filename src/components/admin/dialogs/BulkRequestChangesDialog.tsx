import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/components/ui/notifications-system";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface BulkRequestChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: string[];
  userRole: 'promoter' | 'company';
  userCount: number;
}

const REQUEST_TYPES = [
  { value: 'file_upload', label: 'File Upload' },
  { value: 'profile_info', label: 'Profile Information' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
] as const;

const PROMOTER_FIELDS = [
  { value: 'id_card', label: 'ID Card' },
  { value: 'profile_photo', label: 'Profile Photo' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'phone_number', label: 'Phone Number' },
  { value: 'email', label: 'Email' },
  { value: 'nationality', label: 'Nationality' },
  { value: 'address', label: 'Address' },
  { value: 'bank_details', label: 'Bank Details' },
] as const;

const COMPANY_FIELDS = [
  { value: 'logo', label: 'Company Logo' },
  { value: 'cr_document', label: 'Commercial Registration (CR)' },
  { value: 'business_certificate', label: 'Business Certificate' },
  { value: 'company_name', label: 'Company Name' },
  { value: 'registration_id', label: 'Registration ID' },
  { value: 'industry', label: 'Industry' },
  { value: 'address', label: 'Address' },
  { value: 'website', label: 'Website' },
] as const;

export function BulkRequestChangesDialog({
  open,
  onOpenChange,
  userIds,
  userRole,
  userCount
}: BulkRequestChangesDialogProps) {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<string>('');
  const [fieldName, setFieldName] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const availableFields = userRole === 'promoter' ? PROMOTER_FIELDS : COMPANY_FIELDS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestType || !fieldName || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to request changes');
      return;
    }

    if (userIds.length === 0) {
      toast.error('No users selected');
      return;
    }

    setLoading(true);
    try {
      // Create profile change requests for all selected users
      const requests = userIds.map(userId => ({
        user_id: userId,
        requested_by: user.id,
        request_type: requestType,
        field_name: fieldName,
        message: message.trim(),
        status: 'pending'
      }));

      const { data: requestData, error: requestError } = await supabase
        .from('profile_change_requests')
        .insert(requests)
        .select();

      if (requestError) {
        // Check if table doesn't exist
        if (requestError.code === 'PGRST116' || requestError.code === '42P01') {
          toast.error('Profile change requests feature is not available. Please run database migrations.');
          setLoading(false);
          return;
        }
        throw requestError;
      }

      // Send notifications to all users
      const fieldLabel = availableFields.find(f => f.value === fieldName)?.label || fieldName;
      const notificationTitle = 'Profile Update Required';
      const notificationMessage = `${fieldLabel}: ${message.trim()}`;
      
      const notificationPromises = userIds.map(userId =>
        sendNotification(
          userId,
          notificationTitle,
          notificationMessage,
          'warning',
          requestData?.find(r => r.user_id === userId)?.id
        )
      );

      await Promise.all(notificationPromises);

      toast.success(`Change requests sent to ${userCount} ${userRole}${userCount > 1 ? 's' : ''}`);
      onOpenChange(false);
      
      // Reset form
      setRequestType('');
      setFieldName('');
      setMessage('');
      
    } catch (error) {
      console.error('Error creating bulk change requests:', error);
      toast.error('Failed to send change requests');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRequestType('');
      setFieldName('');
      setMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Request Profile Changes (Bulk)</DialogTitle>
          <DialogDescription>
            Request {userCount} {userRole}{userCount > 1 ? 's' : ''} to update their profile information or upload required documents.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="requestType">Request Type *</Label>
            <Select value={requestType} onValueChange={setRequestType} required>
              <SelectTrigger id="requestType">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Name */}
          <div className="space-y-2">
            <Label htmlFor="fieldName">Field to Update *</Label>
            <Select value={fieldName} onValueChange={setFieldName} required>
              <SelectTrigger id="fieldName">
                <SelectValue placeholder="Select field that needs updating" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Explain what needs to be fixed or updated..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent to all selected users as a notification.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !requestType || !fieldName || !message.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send to {userCount} {userRole}{userCount > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
