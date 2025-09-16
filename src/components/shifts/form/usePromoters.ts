
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase, enhancedQuery } from "@/integrations/supabase/client";
import { PromoterOption } from "../types/PromoterTypes";

export default function usePromoters() {
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromoters = async () => {
    setLoadingPromoters(true);
    setError(null);
    
    try {
      console.log("Fetching promoters data...");
      
      // Fetch verified promoters from profiles table with enhanced error handling
      type RawPromoter = {
        id: string;
        unique_code: string | null;
        full_name: string | null;
        age: number | null;
        nationality: string | null;
        phone_number: string | null;
        role?: string;
        verification_status?: string;
      };

      // Try to fetch promoters - start with enhanced query first
      let data;
      try {
        // Try enhanced query first (should work after adding unique_code column)
        console.log("Trying enhanced query with unique_code column...");
        data = await enhancedQuery.select<RawPromoter>(
          'profiles',
          'id, unique_code, full_name, age, nationality, phone_number, role, verification_status'
        );
        console.log("✅ Enhanced query succeeded!", data?.length || 0, "records found");
      } catch (error) {
        console.log("Enhanced query failed, trying basic query:", error);
        
        // Fallback to basic query with only existing columns
        const basicData = await enhancedQuery.select(
          'profiles',
          'id, full_name, role, verification_status, email'
        );
        
        console.log("Basic profiles data:", basicData);
        
        // Transform basic data to match expected structure with fallback unique codes
        data = basicData?.map(p => {
          const fallbackUniqueCode = `USR${p.id.slice(-5).toUpperCase()}`;
          
          console.log(`Processing ${p.full_name}: generating fallback code ${fallbackUniqueCode}`);
          
          return {
            id: p.id,
            unique_code: fallbackUniqueCode, // Use fallback code since we can't access metadata
            full_name: p.full_name || 'Unknown User',
            age: 25, // Default
            nationality: 'Not specified', // Default
            phone_number: null,
            role: p.role,
            verification_status: p.verification_status
          };
        }) || [];
      }

      console.log(`Raw data from database:`, data);

      if (!data) {
        throw new Error("No data returned from database");
      }

      // Client-side filter for approved part-timers/promoters
      const filtered = data.filter((p: RawPromoter) => {
        const isValidRole = p.role === 'part_timer' || p.role === 'promoter';
        const isApproved = p.verification_status === 'approved';
        const hasRequiredData = p.id && p.full_name;
        
        if (!isValidRole) {
          console.log(`Filtering out user ${p.id}: invalid role ${p.role}`);
          return false;
        }
        
        if (!isApproved) {
          console.log(`Filtering out user ${p.id}: not approved (${p.verification_status})`);
          return false;
        }
        
        if (!hasRequiredData) {
          console.log(`Filtering out user ${p.id}: missing required data`);
          return false;
        }
        
        return true;
      });

      console.log(`Filtered ${filtered.length} approved promoters from ${data.length} total profiles`);

      if (filtered.length > 0) {
        const formattedPromoters: PromoterOption[] = filtered.map((p: RawPromoter) => {
          // Generate fallback unique code if missing
          const uniqueCode = p.unique_code || `USR${p.id.slice(-5).toUpperCase()}`;
          
          return {
            id: p.id,
            unique_code: uniqueCode,
            full_name: p.full_name || 'Unknown User',
            age: p.age || 25,
            nationality: p.nationality || 'Not specified',
            phone_number: p.phone_number || ''
          };
        });

        setPromoters(formattedPromoters);
        console.log(`Successfully loaded ${formattedPromoters.length} promoters:`, formattedPromoters);
      } else {
        console.log("No approved promoters found in database");
        setPromoters([]);
        
        // Show informative message if no promoters are available
        if (data.length > 0) {
          const pendingCount = data.filter(p => p.verification_status === 'pending').length;
          const roleCount = data.filter(p => p.role !== 'part_timer' && p.role !== 'promoter').length;
          
          if (pendingCount > 0) {
            setError(`${pendingCount} promoter(s) are pending approval`);
          } else if (roleCount === data.length) {
            setError("No part-timer accounts found in the system");
          } else {
            setError("No approved promoters available for assignment");
          }
        } else {
          setError("No user profiles found in the database");
        }
      }
    } catch (error: unknown) {
      console.error("Error fetching promoters:", error);
      
      // Enhanced error handling with specific error messages
      let errorMessage = "Failed to load promoters data";
      
      if (error instanceof Error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          errorMessage = "Database schema mismatch. Please run database migrations.";
          console.error("Schema error detected:", error.message);
        } else if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please check user access rights.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = `Database error: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setPromoters([]);
    } finally {
      setLoadingPromoters(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPromoters();
  }, []);

  // Realtime updates: refresh when a promoter gets approved or a new approved promoter is inserted
  useEffect(() => {
    const channelPartTimer = supabase
      .channel('profiles-promoter-approvals-part_timer')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'role=eq.part_timer' },
        (payload) => {
          const newRow = payload.new as { verification_status?: string };
          const oldRow = payload.old as { verification_status?: string };
          if (newRow?.verification_status === 'approved' && oldRow?.verification_status !== 'approved') {
            fetchPromoters();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.part_timer' },
        (payload) => {
          const newRow = payload.new as { verification_status?: string };
          if (newRow?.verification_status === 'approved') {
            fetchPromoters();
          }
        }
      )
      .subscribe();

    const channelPromoter = supabase
      .channel('profiles-promoter-approvals-promoter')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'role=eq.promoter' },
        (payload) => {
          const newRow = payload.new as { verification_status?: string };
          const oldRow = payload.old as { verification_status?: string };
          if (newRow?.verification_status === 'approved' && oldRow?.verification_status !== 'approved') {
            fetchPromoters();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.promoter' },
        (payload) => {
          const newRow = payload.new as { verification_status?: string };
          if (newRow?.verification_status === 'approved') {
            fetchPromoters();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelPartTimer);
      supabase.removeChannel(channelPromoter);
    };
  }, []);

  return { promoters, loadingPromoters, error, refetch: fetchPromoters };
}
