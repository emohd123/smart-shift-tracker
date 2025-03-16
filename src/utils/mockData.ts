
import { Shift } from "@/components/shifts/ShiftCard";
import { ShiftStatus } from "@/types/database";

// Mock data for development and testing
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
    payRateType: "hour",
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
    payRateType: "hour",
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
    payRateType: "hour",
    isPaid: false
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
    payRateType: "hour",
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
    payRateType: "hour",
    isPaid: false
  }
];
