
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MapSelector from "./MapSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftStatus } from "@/types/database";

export interface PromoterOption {
  id: string;
  full_name: string;
  email: string;
}

export function ShiftForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "17:00",
    payRate: "15",
    selectedPromoterId: ""
  });

  // Fetch promoters for assignment
  useEffect(() => {
    const fetchPromoters = async () => {
      setLoadingPromoters(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'promoter');
        
        if (error) throw error;
        
        if (data) {
          setPromoters(data as PromoterOption[]);
        }
      } catch (error) {
        console.error("Error fetching promoters:", error);
        toast({
          title: "Error",
          description: "Failed to load promoters",
          variant: "destructive"
        });
      } finally {
        setLoadingPromoters(false);
      }
    };

    fetchPromoters();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        date
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.date || !formData.startTime || !formData.endTime || !formData.payRate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Format date to ISO string yyyy-mm-dd
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      // Insert the shift
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          title: formData.title,
          location: formData.location,
          date: formattedDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          pay_rate: parseFloat(formData.payRate),
          status: ShiftStatus.Upcoming
        })
        .select('id')
        .single();

      if (shiftError) throw shiftError;
      
      // If a promoter was selected, assign them to the shift
      if (formData.selectedPromoterId && shiftData) {
        const { error: assignmentError } = await supabase
          .from('shift_assignments')
          .insert({
            shift_id: shiftData.id,
            promoter_id: formData.selectedPromoterId
          });

        if (assignmentError) throw assignmentError;
        
        // Create notification for the promoter
        await supabase
          .from('notifications')
          .insert({
            user_id: formData.selectedPromoterId,
            title: "New Shift Assignment",
            message: `You have been assigned to a new shift: ${formData.title}`,
            type: "shift_assignment",
            read: false,
            related_id: shiftData.id
          });
      }

      toast({
        title: "Success",
        description: "Shift created successfully!"
      });
      
      navigate("/shifts");
    } catch (error: any) {
      console.error("Error creating shift:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Shift Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter shift title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="Enter location"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payRate">Pay Rate (Per Hour)</Label>
            <div className="flex items-center">
              <span className="mr-2">$</span>
              <Input
                id="payRate"
                name="payRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.payRate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="promoter">Assign Promoter (Optional)</Label>
            <Select 
              value={formData.selectedPromoterId} 
              onValueChange={(value) => setFormData({...formData, selectedPromoterId: value})}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a promoter" />
              </SelectTrigger>
              <SelectContent>
                {loadingPromoters ? (
                  <SelectItem value="loading" disabled>Loading promoters...</SelectItem>
                ) : promoters.length === 0 ? (
                  <SelectItem value="none" disabled>No promoters available</SelectItem>
                ) : (
                  <>
                    <SelectItem value="">-- None --</SelectItem>
                    {promoters.map((promoter) => (
                      <SelectItem key={promoter.id} value={promoter.id}>
                        {promoter.full_name} ({promoter.email})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center"
              onClick={() => setShowMap(!showMap)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {showMap ? "Hide Location Map" : "Set Precise Location"}
            </Button>
            
            {showMap && (
              <div className="mt-4">
                <MapSelector 
                  shiftId="new"
                  onSave={() => {
                    toast({
                      title: "Location Saved",
                      description: "Precise location has been saved for this shift"
                    });
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Shift"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
