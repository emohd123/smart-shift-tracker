
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { PromotersList } from "@/components/promoters/list/PromotersList";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserPlus, UserX } from "lucide-react";

const Promoters = () => {
  const { user, isAuthenticated } = useAuth();

  // Only admins should access this page
  if (!isAuthenticated || user?.role !== UserRole.Admin) {
    return <Navigate to="/shifts" replace />;
  }

  return (
    <AppLayout title="Promoter Management">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promoter Management</h1>
          <p className="text-muted-foreground">
            Manage promoters, view their stats, and approve verification requests.
          </p>
        </div>
        
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              All Promoters
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Pending Approval
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Inactive Promoters
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
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
      </div>
    </AppLayout>
  );
};

export default Promoters;
