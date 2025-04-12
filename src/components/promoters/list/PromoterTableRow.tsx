
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TableCell, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { PromoterData } from "../types";

interface PromoterTableRowProps {
  promoter: PromoterData;
  setSelectedPromoter: (id: string) => void;
  handleSelectPromoter: (id: string) => void;
  selectedPromoters: string[];
}

export function PromoterTableRow({
  promoter,
  setSelectedPromoter,
  handleSelectPromoter,
  selectedPromoters
}: PromoterTableRowProps) {
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

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={selectedPromoters.includes(promoter.id)}
          onCheckedChange={() => handleSelectPromoter(promoter.id)}
          aria-label={`Select ${promoter.full_name}`}
        />
      </TableCell>
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
  );
}
