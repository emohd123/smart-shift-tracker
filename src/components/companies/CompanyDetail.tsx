import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Phone, Mail, MapPin, CalendarClock, Globe, FileText, Users, Clock, DollarSign, CheckCircle, XCircle, Download, Image, File, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CompanyData } from "./types";
import { format, parseISO } from "date-fns";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { toast } from "sonner";
import { RequestProfileChangesDialog } from "@/components/admin/dialogs/RequestProfileChangesDialog";
import { useAuth } from "@/context/AuthContext";
import { isAdminLike } from "@/utils/roleUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CompanyDetailProps {
  companyId: string;
  onClose: () => void;
  companyData?: CompanyData;
}

export function CompanyDetail({ companyId, onClose, companyData }: CompanyDetailProps) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = isAdminLike(user?.role);
  const [profile, setProfile] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<{
    logo: string | null;
    cr_document: string | null;
    business_certificate: string | null;
  }>({
    logo: null,
    cr_document: null,
    business_certificate: null,
  });
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch detailed profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', companyId)
          .single();
          
        if (profileError) {
          console.error("Error fetching company profile:", profileError);
        } else {
          setProfile(profileData);
        }

        // Fetch company_profiles
        try {
          const { data: companyProfileData, error: companyProfileError } = await supabase
            .from('company_profiles')
            .select('*')
            .eq('user_id', companyId)
            .maybeSingle();
          
          if (!companyProfileError && companyProfileData) {
            setCompanyProfile(companyProfileData);
            // Set document URLs
            setDocuments({
              logo: companyProfileData.logo_url || null,
              cr_document: companyProfileData.cr_document_url || null,
              business_certificate: companyProfileData.business_certificate_url || null,
            });
          }
        } catch (e) {
          // Table might not exist
        }
        
        // Fetch recent shifts created by this company
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select('id, title, date, location, status, pay_rate')
          .eq('company_id', companyId)
          .order('date', { ascending: false })
          .limit(10);
          
        if (shiftsError) {
          console.error("Error fetching shifts:", shiftsError);
        } else {
          setRecentShifts(shiftsData || []);
        }

        // Fetch unique promoters assigned to this company's shifts
        const { data: shifts } = await supabase
          .from('shifts')
          .select('id')
          .eq('company_id', companyId);

        if (shifts && shifts.length > 0) {
          const shiftIds = shifts.map(s => s.id);
          const { data: assignments } = await supabase
            .from('shift_assignments')
            .select('promoter_id')
            .in('shift_id', shiftIds);

          const uniquePromoterIds = [...new Set((assignments || []).map(a => a.promoter_id))];
          
          if (uniquePromoterIds.length > 0) {
            const { data: promotersData } = await supabase
              .from('profiles')
              .select('id, full_name, unique_code, phone_number')
              .in('id', uniquePromoterIds)
              .eq('role', 'promoter')
              .limit(10);
            
            setPromoters(promotersData || []);
          }
        }

        // Fetch change requests
        try {
          const { data: requestsData, error: requestsError } = await supabase
            .from('profile_change_requests')
            .select(`
              *,
              requested_by_profile:profiles!profile_change_requests_requested_by_fkey(full_name, email)
            `)
            .eq('user_id', companyId)
            .order('created_at', { ascending: false });

          if (!requestsError && requestsData) {
            setChangeRequests(requestsData);
          }
        } catch (e) {
          // Table might not exist yet
          console.warn('profile_change_requests table not found');
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open && companyId) {
      fetchCompanyDetails();
    }
  }, [companyId, open]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleVerificationAction = async (action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success(`Company ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      window.location.reload();
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status');
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const companyName = companyProfile?.name || profile?.company_name || profile?.full_name || "Unknown Company";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Company Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about this company.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="shifts">Recent Shifts</TabsTrigger>
              <TabsTrigger value="promoters">Promoters</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
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
                        <AvatarImage src={companyProfile?.logo_url || ''} alt={companyName} />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                          <Building2 className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-medium">{companyName}</h3>
                      <Badge variant="outline" className="mt-1">
                        {profile?.verification_status || "Unknown Status"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {companyProfile?.registration_id && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>ID: {companyProfile.registration_id}</span>
                        </div>
                      )}
                      {profile?.phone_number && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{profile.phone_number}</span>
                        </div>
                      )}
                      {profile?.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                      {companyProfile?.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{companyProfile.address}</span>
                        </div>
                      )}
                      {companyProfile?.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {companyProfile.website}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center">
                        <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Joined {formatDate(profile?.created_at || "")}</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {profile?.verification_status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleVerificationAction('approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleVerificationAction('reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
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
                    <CardTitle>Business Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Total Shifts</span>
                        <span className="text-sm">{companyData?.totalShifts || 0}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Total Hours</span>
                        <span className="text-sm">{companyData?.totalHours.toFixed(1) || "0.0"} hrs</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Total Spend</span>
                        <span className="text-sm">{formatBHD(companyData?.totalSpend || 0)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Promoters Hired</span>
                        <span className="text-sm">{companyData?.promotersCount || 0}</span>
                      </div>
                    </div>

                    {companyProfile?.industry && (
                      <div className="pt-4 border-t">
                        <div className="text-sm text-muted-foreground mb-1">Industry</div>
                        <div className="font-medium">{companyProfile.industry}</div>
                      </div>
                    )}

                    {companyProfile?.company_size && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Company Size</div>
                        <div className="font-medium">{companyProfile.company_size}</div>
                      </div>
                    )}
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
                  {recentShifts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No shifts found</p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Shift</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Pay Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentShifts.map((shift) => (
                            <TableRow key={shift.id}>
                              <TableCell className="font-medium">{shift.title}</TableCell>
                              <TableCell>{formatDate(shift.date)}</TableCell>
                              <TableCell>{shift.location || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{shift.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatBHD(shift.pay_rate || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promoters" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Promoters Hired</CardTitle>
                </CardHeader>
                <CardContent>
                  {promoters.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No promoters found</p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {promoters.map((promoter) => (
                            <TableRow key={promoter.id}>
                              <TableCell className="font-medium">{promoter.full_name}</TableCell>
                              <TableCell>{promoter.unique_code || "N/A"}</TableCell>
                              <TableCell>{promoter.phone_number || "N/A"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Company Logo */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Image className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Company Logo</div>
                          <div className="text-sm text-muted-foreground">
                            {documents.logo ? "Uploaded" : "Not uploaded"}
                          </div>
                        </div>
                      </div>
                      {documents.logo ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={documents.logo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            View
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No file</span>
                      )}
                    </div>

                    {/* Commercial Registration Document */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Commercial Registration (CR)</div>
                          <div className="text-sm text-muted-foreground">
                            {documents.cr_document ? "Uploaded" : "Not uploaded"}
                          </div>
                        </div>
                      </div>
                      {documents.cr_document ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={documents.cr_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            View
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No file</span>
                      )}
                    </div>

                    {/* Business Certificate */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Business Certificate</div>
                          <div className="text-sm text-muted-foreground">
                            {documents.business_certificate ? "Uploaded" : "Not uploaded"}
                          </div>
                        </div>
                      </div>
                      {documents.business_certificate ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={documents.business_certificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            View
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No file</span>
                      )}
                    </div>

                    {!documents.logo && !documents.cr_document && !documents.business_certificate && (
                      <div className="text-center py-8 text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
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
      </DialogContent>

      {/* Request Changes Dialog */}
      {isAdmin && (
        <RequestProfileChangesDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          userId={companyId}
          userRole="company"
          userName={companyName}
        />
      )}
    </Dialog>
  );
}
