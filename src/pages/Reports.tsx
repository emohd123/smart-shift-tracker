
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/types/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Calendar, Users, Clock, FileText, BarChart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingsTable } from "@/components/ratings/RatingsTable";

const Reports = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("shifts");

  // Show loading state while auth is being checked
  if (loading) {
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

  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Shifts</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                128
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Promoters</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                48
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Hours</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                1,245
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">+18% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Certificates</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                36
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart className="h-6 w-6 text-primary" />
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>
              View and analyze statistics about shifts, promoters and time tracking.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs 
              defaultValue="shifts" 
              className="space-y-6"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-4 md:w-auto md:inline-flex">
                <TabsTrigger value="shifts">Shifts</TabsTrigger>
                <TabsTrigger value="promoters">Promoters</TabsTrigger>
                <TabsTrigger value="time">Time Tracking</TabsTrigger>
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="shifts" className="space-y-4">
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Shift Reports</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      This feature is coming soon. You'll be able to see analytics about shifts, locations, and more.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="promoters" className="space-y-4">
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Promoter Performance</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      This feature is coming soon. You'll be able to see analytics about promoter performance, attendance, and more.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="time" className="space-y-4">
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Time Tracking</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      This feature is coming soon. You'll be able to see analytics about hours worked, wages, and productivity.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ratings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-medium">Promoter Ratings</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View all ratings submitted by companies for promoter performance.
                  </p>
                  <RatingsTable />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter>
            <Button variant="outline">Export Report</Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
