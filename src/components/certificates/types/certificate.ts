
export type Certificate = {
  id: string;
  reference_number: string;
  issue_date: string;
  time_period: string;
  total_hours: number;
  pdf_url: string | null;
  promotion_names?: string[];
  status?: 'approved' | 'pending' | 'rejected' | string; // Allow any string for backward compatibility
  performance_rating?: number;
  issued_by?: string;
  issued_date?: string;
  expiration_date?: string;
  verification_logs?: Array<{
    timestamp: string;
    ip_address: string;
    user_agent: string;
  }> | any; // Use 'any' to handle JSONB from database
};

export type TimePeriod = "3months" | "6months" | "1year" | "all";

export type CertificateType = "skills" | "work_experience";

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
  expirationDate?: string; // Optional expiration date
  status?: string; // Certificate status
  certificateType?: CertificateType; // Type of certificate
}

export interface WorkExperienceData {
  referenceNumber: string;
  promoterName: string;
  totalHours: number;
  totalShifts: number;
  workPeriod: {
    startDate: string;
    endDate: string;
  };
  roles: string[];
  locations: string[];
  shifts: { 
    date: string; 
    title: string; 
    hours: number; 
    location?: string;
    timeLog?: {
      checkIn: string;
      checkOut: string;
      actualHours: number;
    };
  }[];
  timeLogs: {
    totalTrackedHours: number;
    averageHoursPerShift: number;
    mostProductiveDay: string;
  };
  issueDate: string;
  managerContact: string;
  performanceRating: number;
  certificateType: CertificateType;
}
