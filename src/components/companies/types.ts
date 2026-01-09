export interface CompanyData {
  id: string;
  companyName: string;
  registrationId: string | null;
  industry: string | null;
  companySize: string | null;
  signupDate: string;
  verificationStatus: string | null;
  totalShifts: number;
  totalHours: number;
  totalSpend: number;
  promotersCount: number;
  lastActivityDate: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  website: string | null;
  logoUrl: string | null;
  created_at: string;
  [key: string]: string | number | boolean | null;
}

export type SortDirection = "asc" | "desc";

export interface CompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  pendingCompanies: number;
  totalShifts: number;
  avgShiftsPerCompany: number;
  totalSpend: number;
  avgSpendPerCompany: number;
  totalPromoters: number;
  avgPromotersPerCompany: number;
}
