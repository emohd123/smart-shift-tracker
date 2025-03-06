
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Clock, User as UserIcon, Mail, Shield } from "lucide-react";

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API request
    setTimeout(() => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsSubmitting(false);
      setIsEditing(false);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
              <UserIcon size={32} />
            </div>
            
            <h3 className="font-medium text-lg">{user?.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
            
            <div className="mt-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {user?.role}
            </div>
            
            <Separator className="my-6" />
            
            <div className="w-full space-y-4">
              <div className="flex items-center">
                <Mail size={16} className="text-muted-foreground mr-3" />
                <div className="text-sm text-left">{user?.email}</div>
              </div>
              
              <div className="flex items-center">
                <Shield size={16} className="text-muted-foreground mr-3" />
                <div className="text-sm text-left capitalize">{user?.role} access</div>
              </div>
              
              <div className="flex items-center">
                <Clock size={16} className="text-muted-foreground mr-3" />
                <div className="text-sm text-left">
                  Joined {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Profile Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      {user?.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      {user?.email}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm capitalize">
                    {user?.role} (cannot be changed)
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                {isEditing ? (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
