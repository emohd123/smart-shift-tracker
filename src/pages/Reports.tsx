import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/types/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Clock, 
  FileText, 
  BarChart as BarChartIcon, 
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { RatingsTable } from "@/components/ratings/RatingsTable";
import { ChartContainer } from "@/components/admin/shared/ChartContainer";
import { ExportButton } from "@/components/admin/shared/ExportButton";
import { MetricCard } from "@/components/admin/shared/MetricCard";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

type TimeRange = "7d" | "30d" | "90d" | "all" | "custom";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Metrics {
  totalShifts: number;
  totalShiftsGrowth: number;
  activePromoters: number;
  activePromotersGrowth: number;
  totalHours: number;
  totalHoursGrowth: number;
  certificates: number;
  certificatesGrowth: number;
}

const Reports = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("shifts");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [metrics, setMetrics] = useState<Metrics>({
    totalShifts: 0,
    totalShiftsGrowth: 0,
    activePromoters: 0,
    activePromotersGrowth: 0,
    totalHours: 0,
    totalHoursGrowth: 0,
    certificates: 0,
    certificatesGrowth: 0,
  });
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  const [timeLogsData, setTimeLogsData] = useState<any[]>([]);
  const [profilesData, setProfilesData] = useState<any[]>([]);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [ratingsData, setRatingsData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [companyProfilesData, setCompanyProfilesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  // Get date range based on selection
  const getDateRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();

    if (timeRange === "custom") {
      if (customDateFrom && customDateTo) {
        start = new Date(customDateFrom);
        start.setHours(0, 0, 0, 0);
        const endDate = new Date(customDateTo);
        endDate.setHours(23, 59, 59, 999);
        return { start, end: endDate };
      }
      return { start: new Date(0), end };
    }

    switch (timeRange) {
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subDays(end, 30);
        break;
      case "90d":
        start = subDays(end, 90);
        break;
      default:
        start = new Date(0);
    }
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  // Get previous period for comparison
  const getPreviousPeriod = () => {
    const { start, end } = getDateRange();
    const diff = end.getTime() - start.getTime();
    const previousEnd = new Date(start);
    previousEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(previousEnd.getTime() - diff);
    previousStart.setHours(0, 0, 0, 0);
    return { start: previousStart, end: previousEnd };
  };

  // Fetch all data
  useEffect(() => {
    if (!isAuthenticated || user?.role !== UserRole.Admin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { start, end } = getDateRange();
        const { start: prevStart, end: prevEnd } = getPreviousPeriod();

        // Fetch shifts
        let shiftsQuery = supabase.from("shifts").select("*");
        if (timeRange !== "all") {
          shiftsQuery = shiftsQuery.gte("date", start.toISOString().split("T")[0])
            .lte("date", end.toISOString().split("T")[0]);
        }
        const { data: shifts } = await shiftsQuery;

        // Fetch previous period shifts for comparison
        let prevShiftsQuery = supabase.from("shifts").select("*");
        if (timeRange !== "all") {
          prevShiftsQuery = prevShiftsQuery.gte("date", prevStart.toISOString().split("T")[0])
            .lte("date", prevEnd.toISOString().split("T")[0]);
        }
        const { data: prevShifts } = await prevShiftsQuery;

        // Fetch time logs
        let timeLogsQuery = supabase.from("time_logs").select("*").not("check_out_time", "is", null);
        if (timeRange !== "all") {
          timeLogsQuery = timeLogsQuery.gte("check_in_time", start.toISOString())
            .lte("check_in_time", end.toISOString());
        }
        const { data: timeLogs } = await timeLogsQuery;

        // Fetch previous period time logs
        let prevTimeLogsQuery = supabase.from("time_logs").select("*").not("check_out_time", "is", null);
        if (timeRange !== "all") {
          prevTimeLogsQuery = prevTimeLogsQuery.gte("check_in_time", prevStart.toISOString())
            .lte("check_in_time", prevEnd.toISOString());
        }
        const { data: prevTimeLogs } = await prevTimeLogsQuery;

        // Fetch profiles (promoters)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "promoter");

        // Fetch company profiles
        const { data: companies } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "company");

        // Fetch company_profiles for additional details
        let companyProfiles: any[] = [];
        try {
          const { data: companyProfilesData } = await supabase
            .from("company_profiles")
            .select("*");
          companyProfiles = companyProfilesData || [];
        } catch (e) {
          // Table might not exist
          console.warn("company_profiles table not found");
        }

        // Fetch previous period companies for comparison
        let prevCompanies: any[] = [];
        if (timeRange !== "all") {
          const { data: prevCompaniesData } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "company")
            .gte("created_at", prevStart.toISOString())
            .lte("created_at", prevEnd.toISOString());
          prevCompanies = prevCompaniesData || [];
        }

        // Fetch assignments
        const { data: assignments } = await supabase
          .from("shift_assignments")
          .select("*");

        // Fetch ratings
        const { data: ratings } = await supabase
          .from("shift_ratings")
          .select("*");

        // Fetch certificates
        let certificatesCount = 0;
        let prevCertificatesCount = 0;
        try {
          const { count } = await supabase
            .from("certificate_verifications")
            .select("*", { count: "exact", head: true });
          certificatesCount = count || 0;

          if (timeRange !== "all") {
            const { count: prevCount } = await supabase
              .from("certificate_verifications")
              .select("*", { count: "exact", head: true })
              .lte("created_at", prevEnd.toISOString());
            prevCertificatesCount = prevCount || 0;
          }
        } catch (e) {
          // Table might not exist
        }

        setShiftsData(shifts || []);
        setTimeLogsData(timeLogs || []);
        setProfilesData(profiles || []);
        setAssignmentsData(assignments || []);
        setRatingsData(ratings || []);
        setCompaniesData(companies || []);
        setCompanyProfilesData(companyProfiles);

        // Calculate metrics
        const totalShifts = shifts?.length || 0;
        const prevTotalShifts = prevShifts?.length || 0;
        const totalShiftsGrowth = prevTotalShifts > 0 
          ? ((totalShifts - prevTotalShifts) / prevTotalShifts) * 100 
          : 0;

        // Active promoters (promoters with shifts in last 30 days)
        const activePromoterIds = new Set(
          (assignments || [])
            .filter(a => {
              const shift = shifts?.find(s => s.id === a.shift_id);
              return shift && new Date(shift.date) >= subDays(new Date(), 30);
            })
            .map(a => a.promoter_id)
        );
        const activePromoters = activePromoterIds.size;
        const prevActivePromoterIds = new Set(
          (assignments || [])
            .filter(a => {
              const shift = prevShifts?.find(s => s.id === a.shift_id);
              return shift;
            })
            .map(a => a.promoter_id)
        );
        const prevActivePromoters = prevActivePromoterIds.size;
        const activePromotersGrowth = prevActivePromoters > 0
          ? ((activePromoters - prevActivePromoters) / prevActivePromoters) * 100
          : 0;

        const totalHours = (timeLogs || []).reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);
        const prevTotalHours = (prevTimeLogs || []).reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);
        const totalHoursGrowth = prevTotalHours > 0
          ? ((totalHours - prevTotalHours) / prevTotalHours) * 100
          : 0;

        const certificatesGrowth = prevCertificatesCount > 0
          ? ((certificatesCount - prevCertificatesCount) / prevCertificatesCount) * 100
          : 0;

        setMetrics({
          totalShifts,
          totalShiftsGrowth,
          activePromoters,
          activePromotersGrowth,
          totalHours: Math.round(totalHours),
          totalHoursGrowth,
          certificates: certificatesCount,
          certificatesGrowth,
        });
      } catch (error) {
        console.error("Error fetching reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, timeRange, customDateFrom, customDateTo]);

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <AppLayout title="Reports">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Skeleton className="h-4 w-full max-w-md mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full max-w-sm mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Only admins should access this page
  if (!isAuthenticated || user?.role !== UserRole.Admin) {
    return <Navigate to="/shifts" replace />;
  }

  // Calculate shifts analytics
  const shiftsByMonth = useMemo(() => {
    const monthCounts: { [key: string]: number } = {};
    shiftsData.forEach(shift => {
      const date = new Date(shift.date);
      const monthKey = format(date, "MMM yyyy");
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);
  }, [shiftsData]);

  const shiftsByStatus = useMemo(() => {
    const statusCounts: { [key: string]: number } = {};
    shiftsData.forEach(shift => {
      const status = getEffectiveStatus(shift);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [shiftsData]);

  // Note: Company names are fetched separately and can be added to shifts if needed

  const shiftsByCompany = useMemo(() => {
    const companyCounts: { [key: string]: number } = {};
    shiftsData.forEach(shift => {
      const companyId = shift.company_id || "unknown";
      companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
    });
    return Object.entries(companyCounts)
      .map(([companyId, count]) => ({ companyId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [shiftsData]);

  // Calculate promoter analytics
  const promoterStats = useMemo(() => {
    const stats = new Map<string, {
      name: string;
      code: string;
      totalShifts: number;
      totalHours: number;
      avgRating: number;
      completedShifts: number;
      acceptedShifts: number;
    }>();

    profilesData
      .filter(p => p.role === "promoter")
      .forEach(promoter => {
        const promoterAssignments = assignmentsData.filter(a => a.promoter_id === promoter.id);
        const completedShifts = promoterAssignments.filter(a => a.status === "completed").length;
        const acceptedShifts = promoterAssignments.filter(a => a.status === "accepted" || a.status === "completed").length;
        
        const promoterTimeLogs = timeLogsData.filter(log => log.user_id === promoter.id);
        const totalHours = promoterTimeLogs.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);

        const promoterRatings = ratingsData.filter(r => {
          const assignment = assignmentsData.find(a => a.id === r.shift_assignment_id);
          return assignment?.promoter_id === promoter.id;
        });
        const avgRating = promoterRatings.length > 0
          ? promoterRatings.reduce((sum, r) => sum + Number(r.rating), 0) / promoterRatings.length
          : 0;

        stats.set(promoter.id, {
          name: promoter.full_name || "Unknown",
          code: promoter.unique_code || "N/A",
          totalShifts: promoterAssignments.length,
          totalHours,
          avgRating,
          completedShifts,
          acceptedShifts,
        });
      });

    return Array.from(stats.values());
  }, [profilesData, assignmentsData, timeLogsData, ratingsData]);

  const topPerformersByHours = useMemo(() => {
    return [...promoterStats]
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10);
  }, [promoterStats]);

  const topPerformersByRating = useMemo(() => {
    return [...promoterStats]
      .filter(p => p.avgRating > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
  }, [promoterStats]);

  const promotersByVerification = useMemo(() => {
    const counts: { [key: string]: number } = {};
    profilesData
      .filter(p => p.role === "promoter")
      .forEach(p => {
        const status = p.verification_status || "not_verified";
        counts[status] = (counts[status] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [profilesData]);

  // Calculate time tracking analytics
  const hoursByWeek = useMemo(() => {
    const weekHours: { [key: string]: number } = {};
    timeLogsData.forEach(log => {
      const date = new Date(log.check_in_time);
      const weekKey = format(date, "yyyy-MM-dd");
      weekHours[weekKey] = (weekHours[weekKey] || 0) + (Number(log.total_hours) || 0);
    });
    return Object.entries(weekHours)
      .map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-30);
  }, [timeLogsData]);

  const hoursByPromoter = useMemo(() => {
    const promoterHours: { [key: string]: number } = {};
    timeLogsData.forEach(log => {
      promoterHours[log.user_id] = (promoterHours[log.user_id] || 0) + (Number(log.total_hours) || 0);
    });
    return Object.entries(promoterHours)
      .map(([userId, hours]) => {
        const promoter = profilesData.find(p => p.id === userId);
        return {
          name: promoter?.full_name || "Unknown",
          hours: Math.round(hours * 10) / 10,
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [timeLogsData, profilesData]);

  const earningsOverTime = useMemo(() => {
    const earningsByDate: { [key: string]: number } = {};
    timeLogsData.forEach(log => {
      const date = format(new Date(log.check_in_time), "yyyy-MM-dd");
      earningsByDate[date] = (earningsByDate[date] || 0) + (Number(log.earnings) || 0);
    });
    return Object.entries(earningsByDate)
      .map(([date, earnings]) => ({ date, earnings: Math.round(earnings * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [timeLogsData]);

  // Calculate ratings analytics
  const ratingDistribution = useMemo(() => {
    const dist: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingsData.forEach(r => {
      const rating = Number(r.rating);
      if (rating >= 1 && rating <= 5) {
        dist[rating] = (dist[rating] || 0) + 1;
      }
    });
    return Object.entries(dist).map(([rating, count]) => ({ rating: Number(rating), count }));
  }, [ratingsData]);

  const avgRatingOverTime = useMemo(() => {
    const ratingsByMonth: { [key: string]: { sum: number; count: number } } = {};
    ratingsData.forEach(r => {
      const date = new Date(r.created_at);
      const monthKey = format(date, "MMM yyyy");
      if (!ratingsByMonth[monthKey]) {
        ratingsByMonth[monthKey] = { sum: 0, count: 0 };
      }
      ratingsByMonth[monthKey].sum += Number(r.rating);
      ratingsByMonth[monthKey].count += 1;
    });
    return Object.entries(ratingsByMonth)
      .map(([month, data]) => ({ month, avgRating: data.sum / data.count }))
      .slice(-6);
  }, [ratingsData]);

  // Calculate company analytics
  const companyStats = useMemo(() => {
    const stats = new Map<string, {
      companyId: string;
      companyName: string;
      registrationId: string | null;
      industry: string | null;
      companySize: string | null;
      signupDate: string;
      verificationStatus: string | null;
      totalShifts: number;
      totalHours: number;
      totalSpend: number;
      promotersCount: number;
      lastActivityDate: string | null;
    }>();

    companiesData.forEach(company => {
      const companyProfile = companyProfilesData.find(cp => cp.user_id === company.id);
      const companyShifts = shiftsData.filter(s => s.company_id === company.id);
      const companyShiftIds = companyShifts.map(s => s.id);
      
      // Calculate total hours from time logs for this company's shifts
      const companyTimeLogs = timeLogsData.filter(log => companyShiftIds.includes(log.shift_id));
      const totalHours = companyTimeLogs.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);
      
      // Calculate total spend (payable from shifts)
      const totalSpend = companyTimeLogs.reduce((sum, log) => {
        const hours = Number(log.total_hours) || 0;
        const shift = companyShifts.find(s => s.id === log.shift_id);
        const payRate = shift?.pay_rate || 0;
        return sum + (hours * payRate);
      }, 0);

      // Get unique promoters assigned to this company's shifts
      const companyAssignments = assignmentsData.filter(a => companyShiftIds.includes(a.shift_id));
      const uniquePromoters = new Set(companyAssignments.map(a => a.promoter_id));

      // Get last activity date (most recent shift date)
      const lastActivity = companyShifts.length > 0
        ? companyShifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null;

      stats.set(company.id, {
        companyId: company.id,
        companyName: companyProfile?.name || company.company_name || company.full_name || "Unknown",
        registrationId: companyProfile?.registration_id || null,
        industry: companyProfile?.industry || null,
        companySize: companyProfile?.company_size || null,
        signupDate: company.created_at,
        verificationStatus: company.verification_status || null,
        totalShifts: companyShifts.length,
        totalHours,
        totalSpend,
        promotersCount: uniquePromoters.size,
        lastActivityDate: lastActivity,
      });
    });

    return Array.from(stats.values());
  }, [companiesData, companyProfilesData, shiftsData, timeLogsData, assignmentsData]);

  // Company signups over time
  const companySignupsOverTime = useMemo(() => {
    const signupsByMonth: { [key: string]: number } = {};
    companiesData.forEach(company => {
      const date = new Date(company.created_at);
      const monthKey = format(date, "MMM yyyy");
      signupsByMonth[monthKey] = (signupsByMonth[monthKey] || 0) + 1;
    });
    return Object.entries(signupsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);
  }, [companiesData]);

  // Companies by verification status
  const companiesByVerification = useMemo(() => {
    const counts: { [key: string]: number } = {};
    companiesData.forEach(c => {
      const status = c.verification_status || "not_verified";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [companiesData]);

  // Companies by industry
  const companiesByIndustry = useMemo(() => {
    const counts: { [key: string]: number } = {};
    companyStats.forEach(c => {
      const industry = c.industry || "Unknown";
      counts[industry] = (counts[industry] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [companyStats]);

  // Companies by size
  const companiesBySize = useMemo(() => {
    const counts: { [key: string]: number } = {};
    companyStats.forEach(c => {
      const size = c.companySize || "Unknown";
      counts[size] = (counts[size] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [companyStats]);

  // Top companies by shifts
  const topCompaniesByShifts = useMemo(() => {
    return [...companyStats]
      .sort((a, b) => b.totalShifts - a.totalShifts)
      .slice(0, 10);
  }, [companyStats]);

  // Top companies by spend
  const topCompaniesBySpend = useMemo(() => {
    return [...companyStats]
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);
  }, [companyStats]);

  // Active companies (companies with shifts in date range)
  const activeCompanies = useMemo(() => {
    const { start } = getDateRange();
    return companyStats.filter(c => {
      if (!c.lastActivityDate) return false;
      return new Date(c.lastActivityDate) >= start;
    });
  }, [companyStats, timeRange, customDateFrom, customDateTo]);

  // New signups in current period
  const newSignups = useMemo(() => {
    const { start, end } = getDateRange();
    return companiesData.filter(c => {
      const signupDate = new Date(c.created_at);
      return signupDate >= start && signupDate <= end;
    });
  }, [companiesData, timeRange, customDateFrom, customDateTo]);

  // Previous period signups for growth calculation
  const prevNewSignups = useMemo(() => {
    const { start: prevStart, end: prevEnd } = getPreviousPeriod();
    return companiesData.filter(c => {
      const signupDate = new Date(c.created_at);
      return signupDate >= prevStart && signupDate <= prevEnd;
    });
  }, [companiesData, timeRange, customDateFrom, customDateTo]);

  const signupGrowth = prevNewSignups.length > 0
    ? ((newSignups.length - prevNewSignups.length) / prevNewSignups.length) * 100
    : 0;

  // Filter companies for table
  const filteredCompanies = useMemo(() => {
    return companyStats.filter(company => {
      if (!companySearchTerm) return true;
      const term = companySearchTerm.toLowerCase();
      return (
        company.companyName?.toLowerCase().includes(term) ||
        company.registrationId?.toLowerCase().includes(term) ||
        company.industry?.toLowerCase().includes(term)
      );
    });
  }, [companyStats, companySearchTerm]);

  // Filter shifts for table
  const filteredShifts = useMemo(() => {
    return shiftsData.filter(shift => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        shift.title?.toLowerCase().includes(term) ||
        shift.location?.toLowerCase().includes(term) ||
        shift.status?.toLowerCase().includes(term)
      );
    });
  }, [shiftsData, searchTerm]);

  // Export functions
  const exportShiftsData = () => {
    return filteredShifts.map(s => ({
      title: s.title,
      date: s.date,
      status: getEffectiveStatus(s),
      location: s.location || "",
      pay_rate: s.pay_rate || 0,
    }));
  };

  const exportPromotersData = () => {
    return promoterStats.map(p => {
      const promoter = profilesData.find(prof => 
        (prof.full_name === p.name || prof.unique_code === p.code) && prof.role === "promoter"
      );
      const promoterLogs = timeLogsData.filter(log => log.user_id === promoter?.id);
      const totalEarnings = promoterLogs.reduce((sum, log) => sum + (Number(log.earnings) || 0), 0);
      const avgHourlyRate = p.totalHours > 0 ? (totalEarnings / p.totalHours) : 0;
      
      return {
        name: p.name,
        code: p.code,
        signup_date: promoter?.created_at ? format(new Date(promoter.created_at), "yyyy-MM-dd") : "",
        verification_status: promoter?.verification_status || "not_verified",
        total_shifts: p.totalShifts,
        total_hours: p.totalHours.toFixed(2),
        total_earnings: totalEarnings.toFixed(2),
        avg_hourly_rate: avgHourlyRate.toFixed(2),
        avg_rating: p.avgRating > 0 ? p.avgRating.toFixed(2) : "N/A",
        completion_rate: p.acceptedShifts > 0 ? ((p.completedShifts / p.acceptedShifts) * 100).toFixed(1) + "%" : "0%",
      };
    });
  };

  const exportTimeTrackingData = () => {
    return timeLogsData.map(log => {
      const promoter = profilesData.find(p => p.id === log.user_id);
      const shift = shiftsData.find(s => s.id === log.shift_id);
      return {
        date: format(new Date(log.check_in_time), "yyyy-MM-dd"),
        promoter: promoter?.full_name || "Unknown",
        shift: shift?.title || "Unknown",
        hours: log.total_hours || 0,
        earnings: log.earnings || 0,
      };
    });
  };

  const exportRatingsData = () => {
    return ratingsData.map(r => ({
      rating: r.rating,
      comment: r.comment || "",
      created_at: r.created_at,
    }));
  };

  const exportCompaniesData = () => {
    return filteredCompanies.map(c => ({
      company_name: c.companyName,
      registration_id: c.registrationId || "",
      industry: c.industry || "",
      company_size: c.companySize || "",
      signup_date: format(new Date(c.signupDate), "yyyy-MM-dd"),
      verification_status: c.verificationStatus || "",
      total_shifts: c.totalShifts,
      total_hours: c.totalHours.toFixed(2),
      total_spend: c.totalSpend.toFixed(2),
      promoters_count: c.promotersCount,
      last_activity: c.lastActivityDate ? format(new Date(c.lastActivityDate), "yyyy-MM-dd") : "",
    }));
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : "";
    const color = growth >= 0 ? "text-green-600" : "text-red-600";
    const icon = growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    return (
      <span className={`text-xs flex items-center gap-1 ${color}`}>
        {icon}
        {sign}{growth.toFixed(1)}% from last period
      </span>
    );
  };

  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Select a time period to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {timeRange === "custom" && (
                <>
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Shifts</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {metrics.totalShifts.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatGrowth(metrics.totalShiftsGrowth)}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Promoters</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {metrics.activePromoters.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatGrowth(metrics.activePromotersGrowth)}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Hours</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    {metrics.totalHours.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatGrowth(metrics.totalHoursGrowth)}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Certificates</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {metrics.certificates.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatGrowth(metrics.certificatesGrowth)}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Analytics Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BarChartIcon className="h-6 w-6 text-primary" />
                  <CardTitle>Analytics</CardTitle>
                </div>
                <CardDescription>
                  View and analyze statistics about shifts, promoters and time tracking.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs 
              defaultValue="shifts" 
              className="space-y-6"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-5 md:w-auto md:inline-flex">
                <TabsTrigger value="shifts">Shifts</TabsTrigger>
                <TabsTrigger value="promoters">Promoters</TabsTrigger>
                <TabsTrigger value="companies">Companies</TabsTrigger>
                <TabsTrigger value="time">Time Tracking</TabsTrigger>
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
              </TabsList>
              
              {/* Shifts Tab */}
              <TabsContent value="shifts" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Total Shifts"
                        value={shiftsData.length}
                        icon={Calendar}
                        iconClassName="text-blue-600"
                      />
                      <MetricCard
                        title="Completed"
                        value={shiftsByStatus.find(s => s.name === "completed")?.value || 0}
                        icon={CheckCircle}
                        iconClassName="text-green-600"
                      />
                      <MetricCard
                        title="Cancelled"
                        value={shiftsByStatus.find(s => s.name === "cancelled")?.value || 0}
                        icon={XCircle}
                        iconClassName="text-red-600"
                      />
                      <MetricCard
                        title="Avg per Week"
                        value={shiftsData.length > 0 ? Math.round((shiftsData.length / Math.max(1, (getDateRange().end.getTime() - getDateRange().start.getTime()) / (7 * 24 * 60 * 60 * 1000))) * 10) / 10 : 0}
                        icon={BarChart3}
                        iconClassName="text-purple-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ChartContainer title="Shifts Over Time" description="Monthly shift count trend">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={shiftsByMonth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Shifts" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <ChartContainer title="Shifts by Status" description="Current distribution">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={shiftsByStatus}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {shiftsByStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Shift Data</CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search shifts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[200px]"
                              />
                            </div>
                            <ExportButton
                              data={exportShiftsData()}
                              filename="shifts-report"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Pay Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredShifts.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No shifts found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredShifts.slice(0, 50).map((shift) => (
                                  <TableRow key={shift.id}>
                                    <TableCell className="font-medium">{shift.title}</TableCell>
                                    <TableCell>{format(new Date(shift.date), "MMM dd, yyyy")}</TableCell>
                                    <TableCell>{shift.location || "N/A"}</TableCell>
                                    <TableCell>
                                      <Badge variant={
                                        getEffectiveStatus(shift) === "completed" ? "default" :
                                        getEffectiveStatus(shift) === "cancelled" ? "destructive" :
                                        getEffectiveStatus(shift) === "ongoing" ? "default" : "outline"
                                      }>
                                        {getEffectiveStatus(shift)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatBHD(shift.pay_rate || 0)}/{shift.pay_rate_type || "hr"}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
              
              {/* Promoters Tab */}
              <TabsContent value="promoters" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Total Promoters"
                        value={profilesData.filter(p => p.role === "promoter").length}
                        icon={Users}
                        iconClassName="text-blue-600"
                      />
                      <MetricCard
                        title="Active Promoters"
                        value={metrics.activePromoters}
                        icon={CheckCircle}
                        iconClassName="text-green-600"
                      />
                      <MetricCard
                        title="Avg Rating"
                        value={ratingsData.length > 0 
                          ? (ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / ratingsData.length).toFixed(1)
                          : "0.0"}
                        icon={Star}
                        iconClassName="text-yellow-600"
                      />
                      <MetricCard
                        title="Avg Hours/Promoter"
                        value={promoterStats.length > 0
                          ? Math.round((promoterStats.reduce((sum, p) => sum + p.totalHours, 0) / promoterStats.length) * 10) / 10
                          : 0}
                        icon={Clock}
                        iconClassName="text-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ChartContainer title="Top Performers by Hours" description="Top 10 promoters by total hours">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={topPerformersByHours}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalHours" fill="#8884d8" name="Hours" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <ChartContainer title="Top Performers by Rating" description="Top 10 promoters by average rating">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={topPerformersByRating}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Bar dataKey="avgRating" fill="#00C49F" name="Rating" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    <ChartContainer title="Promoters by Verification Status" description="Distribution of verification status">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={promotersByVerification}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {promotersByVerification.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Promoter Performance</CardTitle>
                          <ExportButton
                            data={exportPromotersData()}
                            filename="promoters-report"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Signup Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Shifts</TableHead>
                                <TableHead className="text-right">Hours</TableHead>
                                <TableHead className="text-right">Avg Rating</TableHead>
                                <TableHead className="text-right">Completion Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {promoterStats.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No promoter data available
                                  </TableCell>
                                </TableRow>
                              ) : (
                                promoterStats
                                  .sort((a, b) => b.totalHours - a.totalHours)
                                  .slice(0, 50)
                                  .map((promoter, idx) => {
                                    const promoterProfile = profilesData.find(p => 
                                      (p.full_name === promoter.name || p.unique_code === promoter.code) && p.role === "promoter"
                                    );
                                    return (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">{promoter.name}</TableCell>
                                        <TableCell>{promoter.code}</TableCell>
                                        <TableCell>
                                          {promoterProfile?.created_at
                                            ? format(new Date(promoterProfile.created_at), "MMM dd, yyyy")
                                            : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={
                                            promoterProfile?.verification_status === "verified" ? "default" :
                                            promoterProfile?.verification_status === "pending" ? "outline" : "secondary"
                                          }>
                                            {promoterProfile?.verification_status || "not_verified"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{promoter.totalShifts}</TableCell>
                                        <TableCell className="text-right">{promoter.totalHours.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right">
                                          {promoter.avgRating > 0 ? promoter.avgRating.toFixed(1) : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {promoter.acceptedShifts > 0
                                            ? `${((promoter.completedShifts / promoter.acceptedShifts) * 100).toFixed(1)}%`
                                            : "0%"}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
              
              {/* Companies Tab */}
              <TabsContent value="companies" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Total Companies"
                        value={companiesData.length}
                        icon={Building2}
                        iconClassName="text-blue-600"
                      />
                      <MetricCard
                        title="New Signups"
                        value={newSignups.length}
                        icon={TrendingUp}
                        iconClassName="text-green-600"
                        trend={{
                          value: signupGrowth,
                          isPositive: signupGrowth >= 0,
                        }}
                      />
                      <MetricCard
                        title="Active Companies"
                        value={activeCompanies.length}
                        icon={CheckCircle}
                        iconClassName="text-purple-600"
                      />
                      <MetricCard
                        title="Inactive Companies"
                        value={companyStats.length - activeCompanies.length}
                        icon={AlertCircle}
                        iconClassName="text-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ChartContainer title="Company Signups Over Time" description="Monthly signup trend">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={companySignupsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Signups" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <ChartContainer title="Companies by Verification Status" description="Distribution of verification status">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={companiesByVerification}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {companiesByVerification.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    {companiesByIndustry.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ChartContainer title="Companies by Industry" description="Distribution by industry">
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={companiesByIndustry.slice(0, 10)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#00C49F" name="Companies" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>

                        {companiesBySize.length > 0 && (
                          <ChartContainer title="Companies by Size" description="Distribution by company size">
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={companiesBySize}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {companiesBySize.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ChartContainer title="Top Companies by Shifts Created" description="Top 10 companies">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={topCompaniesByShifts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="companyName" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalShifts" fill="#8884d8" name="Shifts" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <ChartContainer title="Top Companies by Spend" description="Top 10 companies by total spend">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={topCompaniesBySpend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="companyName" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalSpend" fill="#FF8042" name="Spend" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Company Details</CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search companies..."
                                value={companySearchTerm}
                                onChange={(e) => setCompanySearchTerm(e.target.value)}
                                className="pl-8 w-[200px]"
                              />
                            </div>
                            <ExportButton
                              data={exportCompaniesData()}
                              filename="companies-report"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Company Name</TableHead>
                                <TableHead>Registration ID</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Signup Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Shifts</TableHead>
                                <TableHead className="text-right">Hours</TableHead>
                                <TableHead className="text-right">Spend</TableHead>
                                <TableHead className="text-right">Promoters</TableHead>
                                <TableHead>Last Activity</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCompanies.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    No companies found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredCompanies
                                  .sort((a, b) => new Date(b.signupDate).getTime() - new Date(a.signupDate).getTime())
                                  .slice(0, 50)
                                  .map((company) => (
                                    <TableRow key={company.companyId}>
                                      <TableCell className="font-medium">{company.companyName}</TableCell>
                                      <TableCell>{company.registrationId || "N/A"}</TableCell>
                                      <TableCell>{company.industry || "N/A"}</TableCell>
                                      <TableCell>{company.companySize || "N/A"}</TableCell>
                                      <TableCell>{format(new Date(company.signupDate), "MMM dd, yyyy")}</TableCell>
                                      <TableCell>
                                        <Badge variant={
                                          company.verificationStatus === "verified" ? "default" :
                                          company.verificationStatus === "pending" ? "outline" : "secondary"
                                        }>
                                          {company.verificationStatus || "not_verified"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">{company.totalShifts}</TableCell>
                                      <TableCell className="text-right">{company.totalHours.toFixed(1)}h</TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {formatBHD(company.totalSpend)}
                                      </TableCell>
                                      <TableCell className="text-right">{company.promotersCount}</TableCell>
                                      <TableCell>
                                        {company.lastActivityDate
                                          ? format(new Date(company.lastActivityDate), "MMM dd, yyyy")
                                          : "Never"}
                                      </TableCell>
                                    </TableRow>
                                  ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
              
              {/* Time Tracking Tab */}
              <TabsContent value="time" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Total Hours"
                        value={Math.round(timeLogsData.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0))}
                        icon={Clock}
                        iconClassName="text-blue-600"
                      />
                      <MetricCard
                        title="Avg Hours/Shift"
                        value={timeLogsData.length > 0
                          ? (timeLogsData.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0) / timeLogsData.length).toFixed(1)
                          : "0.0"}
                        icon={BarChart3}
                        iconClassName="text-purple-600"
                      />
                      <MetricCard
                        title="Total Earnings"
                        value={formatBHD(timeLogsData.reduce((sum, log) => sum + (Number(log.earnings) || 0), 0))}
                        icon={DollarSign}
                        iconClassName="text-green-600"
                      />
                      <MetricCard
                        title="Avg Hourly Rate"
                        value={(() => {
                          const totalHours = timeLogsData.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);
                          const totalEarnings = timeLogsData.reduce((sum, log) => sum + (Number(log.earnings) || 0), 0);
                          return totalHours > 0 ? formatBHD(totalEarnings / totalHours) : formatBHD(0);
                        })()}
                        icon={TrendingUp}
                        iconClassName="text-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ChartContainer title="Hours Worked Over Time" description="Daily hours breakdown">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={hoursByWeek}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="hours" stroke="#8884d8" strokeWidth={2} name="Hours" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <ChartContainer title="Top Promoters by Hours" description="Top 10 promoters">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={hoursByPromoter}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="hours" fill="#82ca9d" name="Hours" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    <ChartContainer title="Earnings Over Time" description="Daily earnings trend">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={earningsOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="earnings" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Earnings" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Time Log Data</CardTitle>
                          <ExportButton
                            data={exportTimeTrackingData()}
                            filename="time-tracking-report"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Promoter</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead className="text-right">Hours</TableHead>
                                <TableHead className="text-right">Earnings</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {timeLogsData.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No time logs found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                timeLogsData.slice(0, 50).map((log) => {
                                  const promoter = profilesData.find(p => p.id === log.user_id);
                                  const shift = shiftsData.find(s => s.id === log.shift_id);
                                  return (
                                    <TableRow key={log.id}>
                                      <TableCell>{format(new Date(log.check_in_time), "MMM dd, yyyy")}</TableCell>
                                      <TableCell>{promoter?.full_name || "Unknown"}</TableCell>
                                      <TableCell>{shift?.title || "Unknown"}</TableCell>
                                      <TableCell className="text-right">{(log.total_hours || 0).toFixed(2)}h</TableCell>
                                      <TableCell className="text-right">{formatBHD(log.earnings || 0)}</TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Ratings Tab */}
              <TabsContent value="ratings" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Average Rating"
                        value={ratingsData.length > 0
                          ? (ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / ratingsData.length).toFixed(1)
                          : "0.0"}
                        icon={Star}
                        iconClassName="text-yellow-600"
                      />
                      <MetricCard
                        title="Total Ratings"
                        value={ratingsData.length}
                        icon={BarChart3}
                        iconClassName="text-blue-600"
                      />
                      <MetricCard
                        title="5-Star Ratings"
                        value={ratingsData.filter(r => Number(r.rating) === 5).length}
                        icon={Star}
                        iconClassName="text-green-600"
                      />
                      <MetricCard
                        title="Rating Trend"
                        value={avgRatingOverTime.length > 1
                          ? (avgRatingOverTime[avgRatingOverTime.length - 1].avgRating > avgRatingOverTime[avgRatingOverTime.length - 2].avgRating ? "↑" : "↓")
                          : "—"}
                        icon={TrendingUp}
                        iconClassName="text-purple-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ChartContainer title="Rating Distribution" description="Distribution of ratings (1-5 stars)">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={ratingDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="rating" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" name="Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <ChartContainer title="Average Rating Over Time" description="Monthly average rating trend">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={avgRatingOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="avgRating" stroke="#00C49F" strokeWidth={2} name="Avg Rating" />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <CardTitle>Promoter Ratings</CardTitle>
                            </div>
                            <CardDescription>
                              View all ratings submitted by companies for promoter performance.
                            </CardDescription>
                          </div>
                          <ExportButton
                            data={exportRatingsData()}
                            filename="ratings-report"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <RatingsTable />
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
