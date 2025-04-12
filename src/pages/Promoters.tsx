
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { PromotersList } from "@/components/promoters/list/PromotersList";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Promoters = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Only admins should access this page
  if (!isAuthenticated || user?.role !== UserRole.Admin) {
    return <Navigate to="/shifts" replace />;
  }

  return (
    <AppLayout title="Promoter Management">
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold tracking-tight">Promoter Management</CardTitle>
            </div>
            <CardDescription>
              Manage promoters, view their stats, and approve verification requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs 
              defaultValue="all" 
              className="space-y-6"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-3 md:w-auto md:inline-flex">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">All Promoters</span>
                  <span className="sm:hidden">All</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Pending Approval</span>
                  <span className="sm:hidden">Pending</span>
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  <span className="hidden sm:inline">Inactive Promoters</span>
                  <span className="sm:hidden">Inactive</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0 space-y-4">
                <PromotersList />
              </TabsContent>
              
              <TabsContent value="pending" className="mt-0">
                <div className="rounded-lg border p-8 text-center">
                  <h3 className="text-lg font-medium">Pending Approval Section</h3>
                  <p className="text-muted-foreground mt-2">
                    This section will show promoters awaiting approval. Coming soon!
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="inactive" className="mt-0">
                <div className="rounded-lg border p-8 text-center">
                  <h3 className="text-lg font-medium">Inactive Promoters Section</h3>
                  <p className="text-muted-foreground mt-2">
                    This section will show inactive or rejected promoters. Coming soon!
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Promoters;
