
export type Certificate = {
  id: string;
  reference_number: string;
  issue_date: string;
  time_period: string;
  total_hours: number;
  pdf_url: string | null;
  promotion_names?: string[];
  status?: 'verified' | 'pending' | 'expired' | string; // Allow any string for backward compatibility
  performance_rating?: number;
};

export type TimePeriod = "3months" | "6months" | "1year" | "all";

export interface CertificateData {
  referenceNumber: string;
  promoterName: string;
  totalHours: number;
  positionTitle: string;
  promotionNames: string[];
  skillsGained: string[];
  shifts: { date: string; title: string; hours: number; location?: string }[];
  issueDate: string;
  managerContact: string;
  performanceRating: number;
}
