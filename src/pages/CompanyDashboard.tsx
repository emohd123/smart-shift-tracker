import { useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, FileEdit, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompanyLiveData } from "@/hooks/company/useCompanyLiveData";
import LiveDashboardStats from "@/components/dashboard/company/LiveDashboardStats";
import ActiveShiftCard from "@/components/dashboard/company/ActiveShiftCard";
import { BrowsePromotersCard } from "@/components/dashboard/company/BrowsePromotersCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftApprovalManager } from "@/components/shifts/approval/ShiftApprovalManager";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { ongoingShifts, totalActivePromoters, totalLiveEarnings, loading } = useCompanyLiveData(user?.id);

  useEffect(() => {
    document.title = "Company Dashboard | SmartShift";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Company dashboard to manage shifts and company profile.");
  }, []);

  const totalHours = ongoingShifts.reduce(
    (sum, shift) => sum + shift.activePromoters.reduce((s, p) => s + p.elapsedHours, 0),
    0
  );

  return (
    <AppLayout title="Company Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Live Operations</h2>
          <p className="text-muted-foreground">Real-time view of your active shifts</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-12 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <LiveDashboardStats
            activeShifts={ongoingShifts.length}
            activePromoters={totalActivePromoters}
            totalHours={totalHours}
            liveEarnings={totalLiveEarnings}
          />
        )}

        <div>
          <h3 className="text-xl font-semibold mb-4">
            Active Shifts Right Now ({ongoingShifts.length})
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-48 w-full" />
                </Card>
              ))}
            </div>
          ) : ongoingShifts.length > 0 ? (
            <div className="space-y-4">
              {ongoingShifts.map((shift) => (
                <ActiveShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">No Active Shifts</h3>
                  <p className="text-muted-foreground">
                    All shifts are completed or upcoming
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button asChild variant="outline">
                    <Link to="/shifts">View All Shifts</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/shifts/create">Create New Shift</Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Pending Work Approvals Section */}
        {user?.id && (
          <div>
            <ShiftApprovalManager companyId={user.id} />
          </div>
        )}

        {/* Available Promoters Section */}
        {user?.id && (
          <div>
            <BrowsePromotersCard companyId={user.id} />
          </div>
        )}

        <div>
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold">Create a Shift</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Post a new shift and assign promoters.
                  </p>
                </div>
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <Button asChild className="mt-4">
                <Link to="/shifts/create">
                  Create Shift
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold">View All Shifts</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage all your shifts and assignments.
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <Button asChild variant="secondary" className="mt-4">
                <Link to="/shifts">
                  View Shifts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold">Company Profile</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update your company information and logo.
                  </p>
                </div>
                <FileEdit className="h-6 w-6 text-primary" />
              </div>
              <Button asChild variant="secondary" className="mt-4">
                <Link to="/company/profile">
                  Edit Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
