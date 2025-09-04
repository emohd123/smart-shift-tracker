
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfileUpdateForm from "./ProfileUpdateForm";
import PasswordChangeForm from "./PasswordChangeForm";
import AccountRemovalForm from "./AccountRemovalForm";
import { useResponsive } from "@/hooks/useResponsive";

export default function AccountSettingsLayout() {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoaded, setIsLoaded] = useState(false);

  // Add animation effect
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Tabs 
        defaultValue="profile" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList 
          className={`grid w-full md:w-auto grid-cols-3 ${isMobile ? 'sticky top-0 z-10 bg-background/80 backdrop-blur-sm' : ''}`}
        >
          <TabsTrigger value="profile" className="data-[state=active]:shadow-sm">Profile</TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:shadow-sm">Password</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:shadow-sm">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6 animate-fade-in">
          <ProfileUpdateForm />
        </TabsContent>
        
        <TabsContent value="password" className="mt-6 animate-fade-in">
          <PasswordChangeForm />
        </TabsContent>
        
        <TabsContent value="account" className="mt-6 animate-fade-in">
          <Card className="p-6">
            <AccountRemovalForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
