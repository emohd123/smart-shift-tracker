import { useState } from "react";
import { PromotersList } from "@/components/promoters/list/PromotersList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserPlus, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersTab() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all platform users including promoters, companies, and administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="all" 
            className="space-y-6"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-3 md:w-auto md:inline-flex">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>All Promoters</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Pending Approval</span>
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                <span>Inactive</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0 space-y-4">
              <PromotersList filterStatus={null} />
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              <PromotersList filterStatus="pending" />
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-0">
              <PromotersList filterStatus="rejected" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
