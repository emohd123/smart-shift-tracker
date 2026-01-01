import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type PromoterRatingStats = {
  averageRating: number | null;
  totalRatings: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export const usePromoterRating = (promoterId: string | undefined): PromoterRatingStats => {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRating = async () => {
    if (!promoterId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the database function to get rating stats
      const { data, error: rpcError } = await supabase.rpc("get_promoter_rating_stats", {
        promoter_uuid: promoterId,
      });

      if (rpcError) {
        // If the function doesn't exist yet, fall back to direct query
        const { data: ratings, error: queryError } = await supabase
          .from("shift_ratings")
          .select("rating")
          .eq("promoter_id", promoterId);

        if (queryError) throw queryError;

        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          setAverageRating(Math.round(avg * 100) / 100);
          setTotalRatings(ratings.length);
        } else {
          setAverageRating(null);
          setTotalRatings(0);
        }
      } else if (data && data.length > 0) {
        setAverageRating(data[0].average_rating);
        setTotalRatings(Number(data[0].total_ratings) || 0);
      } else {
        setAverageRating(null);
        setTotalRatings(0);
      }
    } catch (err: any) {
      console.error("Error fetching promoter rating:", err);
      setError(err.message);
      setAverageRating(null);
      setTotalRatings(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRating();
  }, [promoterId]);

  return { averageRating, totalRatings, loading, error, refetch: fetchRating };
};

export type { PromoterRatingStats };
