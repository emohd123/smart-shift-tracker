
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Mail, CalendarClock, FileText, Download, Image, X, Eye, ExternalLink, AlertTriangle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoterData } from "./types";
import { format, parseISO } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { UserProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { RequestProfileChangesDialog } from "@/components/admin/dialogs/RequestProfileChangesDialog";
import { useAuth } from "@/context/AuthContext";
import { isAdminLike } from "@/utils/roleUtils";

interface PromoterDetailProps {
  promoterId: string;
  onClose: () => void;
  promoterData?: PromoterData;
}

export function PromoterDetail({ promoterId, onClose, promoterData }: PromoterDetailProps) {
  const { user } = useAuth();
  const isAdmin = isAdminLike(user?.role);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'pdf' | 'other' } | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchPromoterDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch detailed profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', promoterId)
          .single();
          
        if (profileError) {
          console.error("Error fetching promoter profile:", profileError);
        } else {
          setProfile(profileData as UserProfile);
        }
        
        // Fetch recent shifts
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('time_logs')
          .select(`
            id,
            check_in_time,
            check_out_time,
            total_hours,
            earnings,
            shift_id
          `)
          .eq('user_id', promoterId)
          .order('check_in_time', { ascending: false })
          .limit(5);
          
        if (shiftsError) {
          console.error("Error fetching shift history:", shiftsError);
        } else {
          // Enhance shifts with additional data
          const enhancedShifts = await Promise.all((shiftsData || []).map(async (shift) => {
            try {
              const { data: shiftData } = await supabase
                .from('shifts')
                .select('title, location')
                .eq('id', shift.shift_id)
                .maybeSingle();
                
              return {
                ...shift,
                title: shiftData?.title || 'Unknown Shift',
                location: shiftData?.location || 'Unknown Location'
              };
            } catch {
              return {
                ...shift,
                title: 'Unknown Shift',
                location: 'Unknown Location'
              };
            }
          }));
          
          setShiftHistory(enhancedShifts);
        }
      } catch (error) {
        console.error("Error fetching promoter details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open && promoterId) {
      fetchPromoterDetails();
    }
  }, [promoterId, open]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  // Generate initial letters for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Format time to readable format
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  // Check if URL is a PDF
  const isPDF = (url: string): boolean => {
    return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('application/pdf');
  };

  // Get file type from URL
  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    if (isPDF(url)) return 'pdf';
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    return 'other';
  };

  // Handle file preview
  const handlePreview = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    setPreviewFile({ url, type: getFileType(url) });
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promoter Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about this promoter.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="shifts">Recent Shifts</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="requests">
                  Change Requests
                  {changeRequests.filter(r => r.status === 'pending').length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {changeRequests.filter(r => r.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Profile Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name} />
                        <AvatarFallback className="text-xl">{getInitials(profile?.full_name || "")}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-medium">{profile?.full_name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {profile?.verification_status || "Unknown Status"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{profile?.phone_number || "No phone number"}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{promoterData?.id.includes('@') ? promoterData?.id : 'Email not available'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{profile?.address || "No address provided"}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Joined {formatDate(profile?.created_at || "")}</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowRequestDialog(true)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Total Hours</span>
                        <span className="text-sm">{promoterData?.total_hours.toFixed(1) || "0"} hrs</span>
                      </div>
                      <Progress value={Math.min(100, (promoterData?.total_hours || 0) / 2)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Shifts Completed</span>
                        <span className="text-sm">{promoterData?.total_shifts || "0"}</span>
                      </div>
                      <Progress value={Math.min(100, (promoterData?.total_shifts || 0) * 5)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Rating</span>
                        <span className="text-sm">{promoterData?.average_rating.toFixed(1) || "0"}/5</span>
                      </div>
                      <Progress value={(promoterData?.average_rating || 0) * 20} className="h-2" />
                    </div>
                    
                    <div className="pt-4 text-sm">
                      <dl className="grid grid-cols-2 gap-2">
                        <dt className="text-muted-foreground">Nationality:</dt>
                        <dd>{profile?.nationality || "Not specified"}</dd>
                        
                        <dt className="text-muted-foreground">Age:</dt>
                        <dd>{profile?.age || "Not specified"}</dd>
                        
                        <dt className="text-muted-foreground">Gender:</dt>
                        <dd>{profile?.gender || "Not specified"}</dd>
                        
                        <dt className="text-muted-foreground">Student:</dt>
                        <dd>{profile?.is_student ? "Yes" : "No"}</dd>
                      </dl>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="shifts" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  {shiftHistory.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No shifts found for this promoter.</p>
                  ) : (
                    <div className="space-y-4">
                      {shiftHistory.map((shift) => (
                        <div key={shift.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{shift.title}</h4>
                              <p className="text-sm text-muted-foreground">{shift.location}</p>
                            </div>
                            <Badge variant="outline">
                              {shift.total_hours} hrs
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <p className="flex items-center">
                              <CalendarClock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {formatDate(shift.check_in_time)} • {formatTime(shift.check_in_time)} - {formatTime(shift.check_out_time)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* ID Card */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">ID Card</div>
                          <div className="text-sm text-muted-foreground">
                            {profile?.id_card_url ? "Uploaded" : "Not uploaded"}
                          </div>
                        </div>
                      </div>
                      {profile?.id_card_url ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handlePreview(profile.id_card_url!, e)}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </button>
                          <a
                            href={profile.id_card_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No file</span>
                      )}
                    </div>

                    {/* Profile Photo */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Image className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Profile Photo</div>
                          <div className="text-sm text-muted-foreground">
                            {profile?.profile_photo_url ? "Uploaded" : "Not uploaded"}
                          </div>
                        </div>
                      </div>
                      {profile?.profile_photo_url ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handlePreview(profile.profile_photo_url!, e)}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </button>
                          <a
                            href={profile.profile_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No file</span>
                      )}
                    </div>

                    {!profile?.id_card_url && !profile?.profile_photo_url && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No files uploaded yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Change Requests Tab (Admin Only) */}
            {isAdmin && (
              <TabsContent value="requests" className="pt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Change Requests</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRequestDialog(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        New Request
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {changeRequests.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No change requests</p>
                    ) : (
                      <div className="space-y-4">
                        {changeRequests.map((request) => (
                          <div key={request.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={
                                    request.status === 'pending' ? 'destructive' :
                                    request.status === 'in_progress' ? 'default' :
                                    request.status === 'resolved' ? 'secondary' : 'outline'
                                  }>
                                    {request.status}
                                  </Badge>
                                  <span className="text-sm font-medium">{request.field_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({request.request_type})
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Requested: {formatDate(request.created_at)}</span>
                                  {request.requested_by_profile && (
                                    <span>By: {request.requested_by_profile.full_name || 'Admin'}</span>
                                  )}
                                  {request.resolved_at && (
                                    <span>Resolved: {formatDate(request.resolved_at)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
        
        <div className="flex justify-end">
          <Button onClick={handleClose}>Close</Button>
        </div>
      </DialogContent>

      {/* Request Changes Dialog */}
      {isAdmin && (
        <RequestProfileChangesDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          userId={promoterId}
          userRole="promoter"
          userName={profile?.full_name || 'Promoter'}
        />
      )}

      {/* File Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="sm:max-w-[90vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>File Preview</DialogTitle>
              <DialogDescription>
                {previewFile.type === 'image' ? 'Image preview' : previewFile.type === 'pdf' ? 'PDF document' : 'File preview'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 bg-muted/50">
              {previewFile.type === 'image' ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <img
                    src={previewFile.url}
                    alt="Preview"
                    className="max-w-full max-h-[80vh] object-contain rounded-md shadow-lg"
                    onError={() => {
                      toast.error('Failed to load image');
                    }}
                  />
                </div>
              ) : previewFile.type === 'pdf' ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">PDF Preview</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                    PDF files cannot be previewed inline due to security restrictions. Please download or open in a new tab to view.
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in New Tab
                    </a>
                    <a
                      href={previewFile.url}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              {previewFile.type === 'pdf' ? (
                <>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </a>
                  <a
                    href={previewFile.url}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </>
              ) : (
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              )}
              <Button variant="outline" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
