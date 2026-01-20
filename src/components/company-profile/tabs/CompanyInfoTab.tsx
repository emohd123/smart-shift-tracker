import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

interface CompanyInfoForm {
  name: string;
  website?: string;
  registration_id: string;
  address: string;
  industry?: string;
  company_size?: string;
  description?: string;
}

export default function CompanyInfoTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const form = useForm<CompanyInfoForm>({
    defaultValues: {
      name: "",
      website: "",
      registration_id: "",
      address: "",
      industry: "",
      company_size: "",
      description: "",
    },
  });

  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading company info:", error);
          toast.error("Failed to load company information");
        } else if (data) {
          form.reset({
            name: data.name ?? "",
            website: data.website ?? "",
            registration_id: data.registration_id ?? "",
            address: data.address ?? "",
            industry: data.industry ?? "",
            company_size: data.company_size ?? "",
            description: data.description ?? "",
          });
        }
      } catch (error) {
        console.error("Error loading company info:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyInfo();
  }, [user?.id, form]);

  const onSubmit = async (values: CompanyInfoForm) => {
    if (!user?.id) {
      toast.error("Not authenticated");
      return;
    }

    setSaving(true);
    try {
      // First try to get existing profile (use user_id for compatibility with both schemas)
      const { data: existingProfile } = await supabase
        .from("company_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("company_profiles")
          .update({
            name: values.name,
            website: values.website || null,
            registration_id: values.registration_id,
            address: values.address,
            industry: values.industry || null,
            company_size: values.company_size || null,
            description: values.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from("company_profiles")
          .insert({
            user_id: user.id,
            name: values.name,
            website: values.website || null,
            registration_id: values.registration_id,
            address: values.address,
            industry: values.industry || null,
            company_size: values.company_size || null,
            description: values.description || null,
          });

        if (error) throw error;
      }

      toast.success("Company information updated successfully");
    } catch (error: any) {
      console.error("Error updating company info:", error);
      // Show actual error message for better debugging
      const message = error?.message || error?.details || "Failed to update company information";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Update your company's basic information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1: Company Name and CR Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>Company Name *</FormLabel>
                      <HelpTooltip content={tooltips.company.profile.companyName} />
                    </div>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registration_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>CR Number (Registration ID) *</FormLabel>
                      <HelpTooltip content={tooltips.company.profile.registrationId} />
                    </div>
                    <FormControl>
                      <Input placeholder="Enter CR number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Website and Industry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>Website URL</FormLabel>
                      <HelpTooltip content={tooltips.company.profile.website} />
                    </div>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry/Sector</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Retail, Marketing, Events" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Company Size and Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>Address *</FormLabel>
                      <HelpTooltip content={tooltips.company.profile.address} />
                    </div>
                    <FormControl>
                      <Input placeholder="Enter company address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your company..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Company Information"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
