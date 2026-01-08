
import { ShiftStatus } from "@/types/database";

export interface Shift {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: ShiftStatus;
  payRate: number;
  payRateType?: string;
  isPaid: boolean;
  is_assigned?: boolean;
  assigned_promoters?: number;
  created_at?: string;
  manual_status_override?: boolean;
  override_status?: ShiftStatus;
  companyId?: string;
  // Enhanced fields
  companyName?: string;
  companyLogoUrl?: string;
  promoterCount?: number;
  activePromoterCount?: number;
  totalHours?: number;
  totalEarnings?: number;
  workApproved?: boolean;
  workApprovedAt?: string;
}

export interface ShiftFormData {
  title: string;
  location: string;
  dateRange: { from: Date; to?: Date } | undefined;
  startTime: string;
  endTime: string;
  payRate: string;
  payRateType: string;
  selectedPromoterIds: string[];
}
