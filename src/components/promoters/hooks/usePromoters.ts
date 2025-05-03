
import { useState } from "react";
import { PromoterData } from "../types";
import { usePromoterData } from "./usePromoterData";
import { filterPromoters } from "./usePromoterFiltering";
import { sortPromoters } from "./usePromoterSorting";
import { SortDirection } from "./types";

export const usePromoters = () => {
  const { promoters, loading, error } = usePromoterData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof PromoterData>("full_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter promoters based on search term
  const filteredPromoters = filterPromoters(promoters, searchTerm);

  // Sort promoters based on selected field
  const sortedPromoters = sortPromoters(filteredPromoters, sortBy, sortDirection);

  const toggleSort = (field: keyof PromoterData) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return {
    promoters: sortedPromoters,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  };
};
