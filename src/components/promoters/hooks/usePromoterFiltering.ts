
import { PromoterData } from "../types";

export function filterPromoters(
  promoters: PromoterData[],
  searchTerm: string
): PromoterData[] {
  if (!searchTerm.trim()) {
    return promoters;
  }

  const searchLower = searchTerm.toLowerCase();
  
  return promoters.filter(promoter => (
    promoter.full_name.toLowerCase().includes(searchLower) ||
    promoter.nationality.toLowerCase().includes(searchLower) ||
    promoter.verification_status.toLowerCase().includes(searchLower) ||
    promoter.phone_number.toLowerCase().includes(searchLower)
  ));
}
