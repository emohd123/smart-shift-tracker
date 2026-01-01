import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingDisplay } from "./RatingDisplay";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type ShiftRating = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  promoter: {
    id: string;
    full_name: string;
    unique_code: string;
  };
  company: {
    id: string;
    full_name: string;
  };
  shift: {
    id: string;
    title: string;
    date: string;
  };
};

type SortField = "rating" | "created_at" | "promoter" | "company" | "shift";
type SortDirection = "asc" | "desc";

export const RatingsTable = () => {
  const [ratings, setRatings] = useState<ShiftRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchRatings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("shift_ratings")
        .select(`
          id,
          rating,
          comment,
          created_at,
          promoter:promoter_id (
            id,
            full_name,
            unique_code
          ),
          company:company_id (
            id,
            full_name
          ),
          shift:shift_id (
            id,
            title,
            date
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Type cast the data to match our expected structure
      const typedRatings = (data || []).map((item: any) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        created_at: item.created_at,
        promoter: item.promoter,
        company: item.company,
        shift: item.shift,
      }));

      setRatings(typedRatings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Filter and sort ratings
  const filteredAndSortedRatings = ratings
    .filter((r) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.promoter?.full_name?.toLowerCase().includes(term) ||
        r.promoter?.unique_code?.toLowerCase().includes(term) ||
        r.company?.full_name?.toLowerCase().includes(term) ||
        r.shift?.title?.toLowerCase().includes(term) ||
        r.comment?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "rating":
          comparison = a.rating - b.rating;
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "promoter":
          comparison = (a.promoter?.full_name || "").localeCompare(b.promoter?.full_name || "");
          break;
        case "company":
          comparison = (a.company?.full_name || "").localeCompare(b.company?.full_name || "");
          break;
        case "shift":
          comparison = (a.shift?.title || "").localeCompare(b.shift?.title || "");
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No ratings have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by promoter, company, or shift..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("promoter")}
                  className="-ml-3 h-8"
                >
                  Promoter
                  {getSortIcon("promoter")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("company")}
                  className="-ml-3 h-8"
                >
                  Company
                  {getSortIcon("company")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("shift")}
                  className="-ml-3 h-8"
                >
                  Shift
                  {getSortIcon("shift")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("rating")}
                  className="-ml-3 h-8"
                >
                  Rating
                  {getSortIcon("rating")}
                </Button>
              </TableHead>
              <TableHead className="max-w-[200px]">Comment</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("created_at")}
                  className="-ml-3 h-8"
                >
                  Date
                  {getSortIcon("created_at")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRatings.map((rating) => (
              <TableRow key={rating.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{rating.promoter?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {rating.promoter?.unique_code || "N/A"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{rating.company?.full_name || "Unknown"}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{rating.shift?.title || "Unknown"}</p>
                    {rating.shift?.date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(rating.shift.date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <RatingDisplay rating={rating.rating} size="sm" showValue />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {rating.comment ? (
                    <p className="text-sm truncate" title={rating.comment}>
                      {rating.comment}
                    </p>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(rating.created_at), "MMM dd, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedRatings.length} of {ratings.length} ratings
      </p>
    </div>
  );
};
