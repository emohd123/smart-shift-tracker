import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PromoterDashboard from "@/components/dashboard/PromoterDashboard";
import { useAuth } from "@/context/AuthContext";
import { ShiftStatus } from "@/types/database";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Shift } from "@/components/shifts/types/ShiftTypes";

// Mock dashboard data for testing
const mockCompletedShifts: Shift[] = [
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
  }
];

const mockCurrentShift: Shift = {
  id: "3",
  title: "Food Sampling at Grocery Store",
  date: new Date().toISOString().split('T')[0], // Today
  startTime: "08:00",
  endTime: "16:00",
  location: "SuperMart, 789 Food Ave",
  status: ShiftStatus.Ongoing,
  payRate: 14,
  isPaid: false
};

const mockUpcomingShifts: Shift[] = [
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
    isPaid: false
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
    isPaid: false
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
    isPaid: false
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

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const dashboardData = useDashboardData(mockUpcomingShifts.concat(mockCompletedShifts, [mockCurrentShift]));

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  if (user?.role === "admin") {
    return (
      <AppLayout title="Admin Dashboard">
        <AdminDashboard
          shifts={mockUpcomingShifts.concat(mockCompletedShifts, [mockCurrentShift])}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Promoter Dashboard">
      <PromoterDashboard
        shifts={mockUpcomingShifts.concat(mockCompletedShifts, [mockCurrentShift])}
      />
    </AppLayout>
  );
};

export default Dashboard;
