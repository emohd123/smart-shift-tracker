
import { PromoterData } from "../types";

export type SortDirection = "asc" | "desc";

export interface PromoterFilters {
  searchTerm: string;
  sortBy: keyof PromoterData;
  sortDirection: SortDirection;
}
