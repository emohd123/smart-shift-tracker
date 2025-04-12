
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TableCell, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { PromoterData } from "../types";
import { Eye } from "lucide-react";

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
  
  // Get status dot indicator color
  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <TableRow 
      className="cursor-pointer transition-colors hover:bg-muted/50"
      data-state={selectedPromoters.includes(promoter.id) ? "selected" : undefined}
    >
      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={selectedPromoters.includes(promoter.id)}
          onCheckedChange={() => handleSelectPromoter(promoter.id)}
          aria-label={`Select ${promoter.full_name}`}
        />
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedPromoter(promoter.id)}>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={promoter.profile_photo_url || ''} alt={promoter.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(promoter.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{promoter.full_name}</div>
            <div className="text-sm text-muted-foreground">{promoter.phone_number}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedPromoter(promoter.id)}>
        {promoter.nationality}
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedPromoter(promoter.id)}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(promoter.verification_status)}`}></div>
          <Badge variant="outline" className={getStatusColor(promoter.verification_status)}>
            {promoter.verification_status.charAt(0).toUpperCase() + promoter.verification_status.slice(1)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedPromoter(promoter.id)} className="text-right">
        <div className="font-medium">{promoter.total_hours.toFixed(1)}</div>
        <div className="text-xs text-muted-foreground">{promoter.total_shifts} shifts</div>
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedPromoter(promoter.id)} className="text-right">
        <div className="font-medium">{promoter.average_rating.toFixed(1)}/5</div>
        <Progress 
          value={promoter.average_rating * 20} 
          className="h-1 w-16 ml-auto" 
          indicatorClassName={promoter.average_rating >= 4 ? "bg-green-500" : promoter.average_rating >= 3 ? "bg-yellow-500" : "bg-red-500"}
        />
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedPromoter(promoter.id)} className="text-right">
        {formatDate(promoter.created_at)}
      </TableCell>
      <TableCell className="py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedPromoter(promoter.id)}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
