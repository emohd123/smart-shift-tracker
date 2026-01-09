import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { CompanyData } from "../types";
import { Eye, Building2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

interface CompanyTableRowProps {
  company: CompanyData;
  setSelectedCompany: (id: string) => void;
  handleSelectCompany: (id: string) => void;
  selectedCompanies: string[];
}

export function CompanyTableRow({
  company,
  setSelectedCompany,
  handleSelectCompany,
  selectedCompanies
}: CompanyTableRowProps) {
  // Generate initial letters for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get status color based on verification status
  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-50 text-gray-700 border-gray-200';
    switch (status.toLowerCase()) {
      case 'approved':
      case 'verified':
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
  const getStatusDotColor = (status: string | null) => {
    if (!status) return 'bg-gray-500';
    switch (status.toLowerCase()) {
      case 'approved':
      case 'verified':
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
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        selectedCompanies.includes(company.id) && "bg-primary/5"
      )}
      data-state={selectedCompanies.includes(company.id) ? "selected" : undefined}
    >
      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={selectedCompanies.includes(company.id)}
          onCheckedChange={() => handleSelectCompany(company.id)}
          aria-label={`Select ${company.companyName}`}
        />
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        <div className="flex items-center gap-3">
          <Avatar className="border border-muted h-10 w-10">
            <AvatarImage src={company.logoUrl || ''} alt={company.companyName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {company.logoUrl ? null : <Building2 className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{company.companyName}</div>
            {company.registrationId && (
              <div className="text-sm text-muted-foreground">
                ID: {company.registrationId}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        {company.registrationId || "N/A"}
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        {company.industry || "N/A"}
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        {company.companySize || "N/A"}
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(company.verificationStatus)}`}></div>
          <Badge variant="outline" className={getStatusColor(company.verificationStatus)}>
            {company.verificationStatus ? 
              company.verificationStatus.charAt(0).toUpperCase() + company.verificationStatus.slice(1) 
              : "Not Verified"}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-3 text-right" onClick={() => setSelectedCompany(company.id)}>
        <div className="font-medium">{company.totalShifts}</div>
      </TableCell>
      <TableCell className="py-3 text-right" onClick={() => setSelectedCompany(company.id)}>
        <div className="font-medium">{company.totalHours.toFixed(1)}h</div>
      </TableCell>
      <TableCell className="py-3 text-right" onClick={() => setSelectedCompany(company.id)}>
        <div className="font-medium">{formatBHD(company.totalSpend)}</div>
      </TableCell>
      <TableCell className="py-3 text-right" onClick={() => setSelectedCompany(company.id)}>
        <div className="font-medium">{company.promotersCount}</div>
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        {formatDate(company.signupDate)}
      </TableCell>
      <TableCell className="py-3" onClick={() => setSelectedCompany(company.id)}>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(company.lastActivityDate)}
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCompany(company.id)}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
