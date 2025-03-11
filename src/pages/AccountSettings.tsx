
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProfileUpdateForm from "@/components/profile/ProfileUpdateForm";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import AccountRemovalForm from "@/components/profile/AccountRemovalForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, UserX } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext";

export default function AccountSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <AppLayout title="Account Settings">
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="flex items-center justify-center space-x-2">
              <User size={16} />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center justify-center space-x-2">
              <Lock size={16} />
              <span>Password</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center justify-center space-x-2">
              <UserX size={16} />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileUpdateForm />
          </TabsContent>
          
          <TabsContent value="password">
            <PasswordChangeForm />
          </TabsContent>
          
          <TabsContent value="account">
            <AccountRemovalForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
