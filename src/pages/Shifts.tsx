
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ShiftList from "@/components/shifts/ShiftList";
import { Shift } from "@/components/shifts/ShiftCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { ShiftStatus } from "@/types/database";

// Mock data for shifts (exported for use in other components)
export const mockShifts: Shift[] = [
  {
    id: "1",
    title: "Product Demo at Central Mall",
    date: "2023-08-15",
    startTime: "09:00",
    endTime: "17:00",
    location: "Central Mall, 123 Main St",
    status: ShiftStatus.Completed,
    payRate: 15,
    isPaid: true
  },
  {
    id: "2",
    title: "Brand Promotion at Tech Expo",
    date: "2023-08-20",
    startTime: "10:00",
    endTime: "18:00",
    location: "Convention Center, 456 Tech Blvd",
    status: ShiftStatus.Completed,
    payRate: 18,
    isPaid: false
  },
  {
    id: "3",
    title: "Food Sampling at Grocery Store",
    date: new Date().toISOString().split('T')[0], // Today
    startTime: "08:00",
    endTime: "16:00",
    location: "SuperMart, 789 Food Ave",
    status: ShiftStatus.Ongoing,
    payRate: 14,
    isPaid: true
  },
  {
    id: "4",
    title: "Fashion Brand Showcase",
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: "11:00",
    endTime: "19:00",
    location: "Fashion Mall, 321 Style St",
    status: ShiftStatus.Upcoming,
    payRate: 16,
    isPaid: false
  },
  {
    id: "5",
    title: "Mobile App Launch Event",
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    startTime: "12:00",
    endTime: "20:00",
    location: "Downtown Plaza, 654 App Rd",
    status: ShiftStatus.Upcoming,
    payRate: 20,
    isPaid: true
  },
  {
    id: "6",
    title: "Health Product Demonstration",
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
    startTime: "09:00",
    endTime: "17:00",
    location: "Wellness Center, 987 Health Pkwy",
    status: ShiftStatus.Upcoming,
    payRate: 15,
    isPaid: false
  },
  {
    id: "7",
    title: "Toy Store Grand Opening",
    date: new Date(Date.now() + 345600000).toISOString().split('T')[0], // 4 days from now
    startTime: "10:00",
    endTime: "18:00",
    location: "Kids Mall, 135 Toy Lane",
    status: ShiftStatus.Upcoming,
    payRate: 14,
    isPaid: true
  },
  {
    id: "8",
    title: "Weekend Market Booth",
    date: new Date(Date.now() + 432000000).toISOString().split('T')[0], // 5 days from now
    startTime: "08:00",
    endTime: "16:00",
    location: "City Market, 246 Market Square",
    status: ShiftStatus.Upcoming,
    payRate: 15,
    isPaid: false
  },
  {
    id: "9",
    title: "Sports Brand Activation",
    date: new Date(Date.now() + 518400000).toISOString().split('T')[0], // 6 days from now
    startTime: "12:00",
    endTime: "20:00",
    location: "Sports Arena, 357 Athletic Dr",
    status: ShiftStatus.Upcoming,
    payRate: 17,
    isPaid: true
  },
  {
    id: "10",
    title: "New Car Model Launch",
    date: new Date(Date.now() + 604800000).toISOString().split('T')[0], // 7 days from now
    startTime: "09:00",
    endTime: "17:00",
    location: "Auto Dealership, 468 Car St",
    status: ShiftStatus.Upcoming,
    payRate: 20,
    isPaid: false
  },
];

// Create a copy of mockShifts that can be modified
let activeShifts = [...mockShifts];

const Shifts = () => {
  const { user, isAuthenticated } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Simulate API request
    const timer = setTimeout(() => {
      // If user is a promoter, filter shifts (in a real app, the API would do this)
      const filteredShifts = user?.role === "promoter" 
        ? activeShifts.filter(shift => true) // In real app, filter by assigned promoter
        : activeShifts;
      
      setShifts(filteredShifts);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user]);

  // This function could be called from other components via a context
  // For now we're just exposing it so ShiftDetails can update the master list
  window.deleteShift = (id: string) => {
    activeShifts = activeShifts.filter(shift => shift.id !== id);
    setShifts(prev => prev.filter(shift => shift.id !== id));
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <AppLayout title={user?.role === "promoter" ? "My Shifts" : "All Shifts"}>
      {loading ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <ShiftList 
          shifts={shifts} 
          title={user?.role === "promoter" ? "My Shifts" : "All Shifts"} 
        />
      )}
    </AppLayout>
  );
};

export default Shifts;
