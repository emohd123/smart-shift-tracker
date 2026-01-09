import { useState } from "react";
import { CompanyData } from "../types";
import { useCompanyData } from "./useCompanyData";
import { filterCompanies } from "./useCompanyFiltering";
import { sortCompanies } from "./useCompanySorting";
import { SortDirection } from "../types";

export const useCompanies = () => {
  const { companies, loading, error } = useCompanyData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof CompanyData>("companyName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter companies based on search term
  const filteredCompanies = filterCompanies(companies, searchTerm);

  // Sort companies based on selected field
  const sortedCompanies = sortCompanies(filteredCompanies, sortBy, sortDirection);

  const toggleSort = (field: keyof CompanyData) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return {
    companies: sortedCompanies,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  };
};
