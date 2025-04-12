
import { useState } from "react";
import { usePromoters } from "./hooks/usePromoters";
import { PromoterStats } from "./PromoterStats";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PromoterDetail } from "./PromoterDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export function PromotersList() {
  const {
    promoters,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  } = usePromoters();
  const [selectedPromoter, setSelectedPromoter] = useState<string | null>(null);

  // Generate initial letters for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get status color based on verification status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Close the detail panel
  const handleCloseDetail = () => {
    setSelectedPromoter(null);
  };

  return (
    <div className="space-y-6">
      <PromoterStats promoters={promoters} loading={loading} />
      
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search promoters..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleSort('full_name')}
                    className="font-semibold"
                  >
                    Promoter {getSortIndicator('full_name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleSort('nationality')}
                    className="font-semibold"
                  >
                    Nationality {getSortIndicator('nationality')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleSort('verification_status')}
                    className="font-semibold"
                  >
                    Status {getSortIndicator('verification_status')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleSort('total_hours')}
                    className="font-semibold"
                  >
                    Hours {getSortIndicator('total_hours')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleSort('average_rating')}
                    className="font-semibold"
                  >
                    Rating {getSortIndicator('average_rating')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleSort('created_at')}
                    className="font-semibold"
                  >
                    Joined {getSortIndicator('created_at')}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No promoters found.
                  </TableCell>
                </TableRow>
              ) : (
                promoters.map((promoter) => (
                  <TableRow key={promoter.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => setSelectedPromoter(promoter.id)}>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={promoter.profile_photo_url || ''} alt={promoter.full_name} />
                          <AvatarFallback>{getInitials(promoter.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{promoter.full_name}</div>
                          <div className="text-sm text-muted-foreground">{promoter.phone_number}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => setSelectedPromoter(promoter.id)}>
                      {promoter.nationality}
                    </TableCell>
                    <TableCell onClick={() => setSelectedPromoter(promoter.id)}>
                      <Badge variant="outline" className={getStatusColor(promoter.verification_status)}>
                        {promoter.verification_status.charAt(0).toUpperCase() + promoter.verification_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => setSelectedPromoter(promoter.id)} className="text-right">
                      <div className="font-medium">{promoter.total_hours.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">{promoter.total_shifts} shifts</div>
                    </TableCell>
                    <TableCell onClick={() => setSelectedPromoter(promoter.id)} className="text-right">
                      <div className="font-medium">{promoter.average_rating.toFixed(1)}/5</div>
                      <Progress value={promoter.average_rating * 20} className="h-1 w-16 ml-auto" />
                    </TableCell>
                    <TableCell onClick={() => setSelectedPromoter(promoter.id)} className="text-right">
                      {formatDate(promoter.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPromoter(promoter.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedPromoter && (
        <PromoterDetail 
          promoterId={selectedPromoter} 
          onClose={handleCloseDetail} 
          promoterData={promoters.find(p => p.id === selectedPromoter)}
        />
      )}
    </div>
  );
}
