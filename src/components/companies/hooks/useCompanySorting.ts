import { CompanyData } from "../types";
import { SortDirection } from "../types";

export function sortCompanies(
  companies: CompanyData[],
  sortBy: keyof CompanyData,
  direction: SortDirection
): CompanyData[] {
  return [...companies].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = "";
    if (bValue === null || bValue === undefined) bValue = "";

    // Handle different data types
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Convert to string for comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    return direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
}
