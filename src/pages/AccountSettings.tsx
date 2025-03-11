
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProfileUpdateForm from "@/components/profile/ProfileUpdateForm";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <AppLayout title="Account Settings">
      <div className="max-w-3xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileUpdateForm />
          </TabsContent>
          
          <TabsContent value="password">
            <PasswordChangeForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
