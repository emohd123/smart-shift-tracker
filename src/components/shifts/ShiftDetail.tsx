import { useState } from "react";
import { Shift } from "./ShiftCard";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  Edit, 
  Trash, 
  ArrowLeft, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type ShiftDetailProps = {
  shift: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

export default function ShiftDetail({ shift, onCheckIn, onCheckOut }: ShiftDetailProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(shift.status === "ongoing");
  
  // Format date to display in a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge design based on shift status
  const getStatusBadge = (status: Shift["status"]) => {
    switch (status) {
      case "upcoming":
        return { 
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          icon: <Calendar size={14} className="mr-1" />
        };
      case "ongoing":
        return { 
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          icon: <Clock size={14} className="mr-1" />
        };
      case "completed":
        return { 
          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
          icon: <CheckCircle size={14} className="mr-1" />
        };
      case "cancelled":
        return { 
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          icon: <XCircle size={14} className="mr-1" />
        };
      default:
        return { 
          color: "bg-gray-100 text-gray-700",
          icon: <AlertCircle size={14} className="mr-1" />
        };
    }
  };
  
  const handleCheckIn = () => {
    setIsCheckedIn(true);
    toast({
      title: "Checked In",
      description: `You've successfully checked in to ${shift.title}`,
    });
    if (onCheckIn) onCheckIn();
  };
  
  const handleCheckOut = () => {
    setIsCheckedIn(false);
    toast({
      title: "Checked Out",
      description: `You've successfully checked out from ${shift.title}`,
    });
    if (onCheckOut) onCheckOut();
  };

  const statusBadge = getStatusBadge(shift.status);
  
  // Check if the status is not "upcoming" or "ongoing"
  const isNotActiveShift = shift.status === "completed" || shift.status === "cancelled";
  
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back
      </Button>
      
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">{shift.title}</CardTitle>
              <CardDescription className="mt-1">
                <Badge className={cn("capitalize flex w-fit items-center", statusBadge.color)}>
                  {statusBadge.icon}
                  {shift.status}
                </Badge>
              </CardDescription>
            </div>
            
            {user?.role === "admin" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit size={14} className="mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash size={14} className="mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar size={18} className="mr-3 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div>{formatDate(shift.date)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock size={18} className="mr-3 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div>{shift.startTime} - {shift.endTime}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin size={18} className="mr-3 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div>{shift.location}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <DollarSign size={18} className="mr-3 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Pay Rate</div>
                  <div>${shift.payRate.toFixed(2)}/hr</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users size={18} className="mr-3 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Assigned To</div>
                  <div>{user?.role === "promoter" ? "You" : "John Doe"}</div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">
              This promotional event requires engaging with customers and distributing product samples.
              Please arrive 15 minutes before the shift starts for briefing.
            </p>
          </div>
        </CardContent>
        
        {user?.role === "promoter" && !isNotActiveShift && (
          <CardFooter className="flex justify-end gap-3">
            {!isCheckedIn ? (
              <Button 
                onClick={handleCheckIn} 
                disabled={isNotActiveShift}
              >
                <Clock size={16} className="mr-2" />
                Check In
              </Button>
            ) : (
              <Button 
                onClick={handleCheckOut}
                variant="outline"
              >
                <Clock size={16} className="mr-2" />
                Check Out
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
