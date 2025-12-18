export type Certificate = {
  id: string;
  reference_number: string;
  issue_date: string;
  time_period: string;
  total_hours: number;
  pdf_url: string | null;
  promotion_names?: string[];
  status?: 'approved' | 'pending' | 'rejected' | string;
  performance_rating?: number;
  issued_by?: string;
  issued_date?: string;
  expiration_date?: string;
  verification_logs?: Array<{
    timestamp: string;
    ip_address: string;
    user_agent: string;
  }> | any;
  paid?: boolean;
  payment_id?: string;
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
  expirationDate?: string;
  status?: string;
  certificateType?: CertificateType;
}

export interface CompanyInfo {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  registration_id?: string;
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
  companyInfo?: CompanyInfo;
}

// Promoter details for certificate
export interface PromoterDetails {
  id: string;
  full_name: string;
  age?: number | null;
  nationality?: string | null;
  phone_number?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
  unique_code?: string | null;
}

// Multi-company certificate types
export interface CompanyWorkEntry {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    website?: string | null;
    email?: string | null;
    phone_number?: string | null;
    registration_number?: string | null;
    contact_person?: string | null;
  };
  shifts: {
    id: string;
    title: string;
    dateFrom: string;
    dateTo: string;
    timeFrom: string;
    timeTo: string;
    totalHours: number;
    location?: string;
    approvedAt: string;
  }[];
  totalHours: number;
}

export interface MultiCompanyCertificate {
  referenceNumber: string;
  promoterName: string;
  issueDate: string;
  companies: CompanyWorkEntry[];
  grandTotalHours: number;
  promoter?: PromoterDetails;
  signature?: string; // Base64 signature image
}
