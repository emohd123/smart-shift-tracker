
import { PromoterData } from "../types";
import { SortDirection } from "./types";

export function sortPromoters(
  promoters: PromoterData[],
  sortBy: keyof PromoterData,
  sortDirection: SortDirection
): PromoterData[] {
  return [...promoters].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // Handle numeric values
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });
}
