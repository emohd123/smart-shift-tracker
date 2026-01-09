import { CompanyData } from "../types";

export function filterCompanies(companies: CompanyData[], searchTerm: string): CompanyData[] {
  if (!searchTerm.trim()) {
    return companies;
  }

  const term = searchTerm.toLowerCase();
  return companies.filter(company => {
    return (
      company.companyName?.toLowerCase().includes(term) ||
      company.registrationId?.toLowerCase().includes(term) ||
      company.industry?.toLowerCase().includes(term) ||
      company.email?.toLowerCase().includes(term)
    );
  });
}
