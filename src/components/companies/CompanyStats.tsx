import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData } from "./types";
import { Building2, Clock, DollarSign, Users, CheckCircle, Clock3, TrendingUp, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

interface CompanyStatsProps {
  companies: CompanyData[];
  loading: boolean;
}

export function CompanyStats({ companies, loading }: CompanyStatsProps) {
  // Calculate statistics
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.verificationStatus === "approved" || c.verificationStatus === "verified").length;
  const pendingCompanies = companies.filter(c => c.verificationStatus === "pending").length;
  const totalShifts = companies.reduce((sum, c) => sum + (c.totalShifts || 0), 0);
  const totalSpend = companies.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalPromoters = companies.reduce((sum, c) => sum + (c.promotersCount || 0), 0);
  
  // Calculate averages
  const avgShiftsPerCompany = totalCompanies > 0 ? totalShifts / totalCompanies : 0;
  const avgSpendPerCompany = totalCompanies > 0 ? totalSpend / totalCompanies : 0;
  const avgPromotersPerCompany = totalCompanies > 0 ? totalPromoters / totalCompanies : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Company Status
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total:</span>
                <span className="text-xl font-bold">{totalCompanies}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Active:</span>
                </div>
                <span className="font-medium text-green-600">{activeCompanies}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">Pending:</span>
                <span className="font-medium text-amber-600">{pendingCompanies}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Business Activity
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Shifts:</span>
                <span className="text-xl font-bold">{totalShifts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 mr-1" />
                  <span>Avg per company:</span>
                </div>
                <span className="font-medium">{avgShiftsPerCompany.toFixed(1)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Financial Metrics
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Spend:</span>
                <span className="text-xl font-bold">{formatBHD(totalSpend)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg per company:</span>
                <span className="font-medium">{formatBHD(avgSpendPerCompany)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Engagement
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Promoters:</span>
                <span className="text-xl font-bold">{totalPromoters}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  <span>Avg per company:</span>
                </div>
                <span className="font-medium">{avgPromotersPerCompany.toFixed(1)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
