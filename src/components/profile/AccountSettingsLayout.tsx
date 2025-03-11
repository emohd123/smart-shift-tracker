
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfileUpdateForm from "./ProfileUpdateForm";
import PasswordChangeForm from "./PasswordChangeForm";
import AccountRemovalForm from "./AccountRemovalForm";

export default function AccountSettingsLayout() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <ProfileUpdateForm />
        </TabsContent>
        
        <TabsContent value="password" className="mt-6">
          <PasswordChangeForm />
        </TabsContent>
        
        <TabsContent value="account" className="mt-6">
          <Card className="p-6">
            <AccountRemovalForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
