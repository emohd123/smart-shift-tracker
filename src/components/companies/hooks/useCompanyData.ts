import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CompanyData } from "../types";

export function useCompanyData() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        
        // Fetch companies from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'company');
          
        if (profileError) {
          throw profileError;
        }

        // Fetch company_profiles for additional details
        let companyProfilesMap = new Map<string, any>();
        try {
          const { data: companyProfilesData } = await supabase
            .from('company_profiles')
            .select('*');
          
          companyProfilesData?.forEach(cp => {
            companyProfilesMap.set(cp.user_id, cp);
          });
        } catch (e) {
          // Table might not exist, continue without it
          console.warn("company_profiles table not found");
        }

        // Fetch shifts to calculate metrics
        const { data: shiftsData } = await supabase
          .from('shifts')
          .select('id, company_id, date, pay_rate');

        // Fetch time logs
        const { data: timeLogsData } = await supabase
          .from('time_logs')
          .select('id, shift_id, total_hours, earnings')
          .not('check_out_time', 'is', null);

        // Fetch assignments to count promoters
        const { data: assignmentsData } = await supabase
          .from('shift_assignments')
          .select('shift_id, promoter_id');

        // Group shifts by company
        const shiftsByCompany = new Map<string, any[]>();
        shiftsData?.forEach(shift => {
          if (shift.company_id) {
            if (!shiftsByCompany.has(shift.company_id)) {
              shiftsByCompany.set(shift.company_id, []);
            }
            shiftsByCompany.get(shift.company_id)?.push(shift);
          }
        });

        // Group time logs by shift
        const timeLogsByShift = new Map<string, any[]>();
        timeLogsData?.forEach(log => {
          if (!timeLogsByShift.has(log.shift_id)) {
            timeLogsByShift.set(log.shift_id, []);
          }
          timeLogsByShift.get(log.shift_id)?.push(log);
        });

        // Group assignments by shift to count unique promoters per company
        const promotersByCompany = new Map<string, Set<string>>();
        assignmentsData?.forEach(assignment => {
          const shift = shiftsData?.find(s => s.id === assignment.shift_id);
          if (shift?.company_id) {
            if (!promotersByCompany.has(shift.company_id)) {
              promotersByCompany.set(shift.company_id, new Set());
            }
            promotersByCompany.get(shift.company_id)?.add(assignment.promoter_id);
          }
        });

        if (profileData) {
          const companiesData: CompanyData[] = profileData.map(profile => {
            const companyProfile = companyProfilesMap.get(profile.id);
            const companyShifts = shiftsByCompany.get(profile.id) || [];
            const companyShiftIds = companyShifts.map(s => s.id);
            
            // Calculate total hours from time logs
            const companyTimeLogs = companyShiftIds.flatMap(shiftId => 
              timeLogsByShift.get(shiftId) || []
            );
            const totalHours = companyTimeLogs.reduce((sum, log) => 
              sum + (Number(log.total_hours) || 0), 0
            );

            // Calculate total spend
            const totalSpend = companyTimeLogs.reduce((sum, log) => {
              const hours = Number(log.total_hours) || 0;
              const shift = companyShifts.find(s => s.id === log.shift_id);
              const payRate = shift?.pay_rate || 0;
              return sum + (hours * payRate);
            }, 0);

            // Get unique promoters count
            const uniquePromoters = promotersByCompany.get(profile.id) || new Set();
            
            // Get last activity date (most recent shift)
            const lastActivity = companyShifts.length > 0
              ? companyShifts.sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0].date
              : null;

            return {
              id: profile.id,
              companyName: companyProfile?.name || profile.company_name || profile.full_name || "Unknown",
              registrationId: companyProfile?.registration_id || null,
              industry: companyProfile?.industry || null,
              companySize: companyProfile?.company_size || null,
              signupDate: profile.created_at,
              verificationStatus: profile.verification_status || null,
              totalShifts: companyShifts.length,
              totalHours,
              totalSpend,
              promotersCount: uniquePromoters.size,
              lastActivityDate: lastActivity,
              email: profile.email || null,
              phoneNumber: profile.phone_number || null,
              address: companyProfile?.address || null,
              website: companyProfile?.website || null,
              logoUrl: companyProfile?.logo_url || null,
              created_at: profile.created_at,
            };
          });
          
          setCompanies(companiesData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        toast.error("Failed to load companies data");
        setCompanies([]);
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return {
    companies,
    loading,
    error
  };
}
