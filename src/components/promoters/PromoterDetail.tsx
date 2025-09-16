
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Mail, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoterData } from "./types";
import { format, parseISO } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { UserProfile } from "@/context/AuthContext";

interface PromoterDetailProps {
  promoterId: string;
  onClose: () => void;
  promoterData?: PromoterData;
}

export function PromoterDetail({ promoterId, onClose, promoterData }: PromoterDetailProps) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shiftHistory, setShiftHistory] = useState<{
    id: string;
    check_in_time: string;
    check_out_time: string;
    total_hours: number;
    earnings: number;
    shift_id: string;
  }[]>([]);

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="shifts">Recent Shifts</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">ID Card</h4>
                      {profile?.id_card_url ? (
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                          <img 
                            src={profile.id_card_url} 
                            alt="ID Card" 
                            className="max-h-full max-w-full object-contain rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                          No ID card uploaded
                        </div>
                      )}
                    </div>

                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Profile Photo</h4>
                      {profile?.profile_photo_url ? (
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                          <img 
                            src={profile.profile_photo_url} 
                            alt="Profile Photo" 
                            className="max-h-full max-w-full object-contain rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                          No profile photo uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        <div className="flex justify-end">
          <Button onClick={handleClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
