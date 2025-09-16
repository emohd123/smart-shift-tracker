import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyProfileForm {
  name: string;
  website?: string;
  registration_id: string;
  address: string;
  logo_file?: FileList;
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const form = useForm<CompanyProfileForm>({
    defaultValues: {
      name: "",
      website: "",
      registration_id: "",
      address: "",
    },
  });

  useEffect(() => {
    document.title = "Company Profile | SmartShift";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Edit your company profile, website, logo and registration details.");
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("company_profiles")
        .select("name, website, registration_id, address, logo_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        toast.error("Failed to load company profile");
      } else if (data) {
        form.reset({
          name: data.name ?? "",
          website: data.website ?? "",
          registration_id: data.registration_id ?? "",
          address: data.address ?? "",
        });
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const uploadLogo = async (file: File) => {
    if (!user?.id) return undefined as unknown as string | undefined;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("company_logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      toast.error("Logo upload failed");
      return undefined;
    }
    const { data } = supabase.storage.from("company_logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async (values: CompanyProfileForm) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      let logo_url: string | undefined = undefined;
      const file = values.logo_file?.[0];
      if (file) {
        logo_url = await uploadLogo(file);
      }

      const payload = {
        user_id: user.id,
        name: values.name,
        website: values.website || null,
        registration_id: values.registration_id,
        address: values.address,
        ...(logo_url && { logo_url })
      };

      const { error } = await supabase
        .from("company_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Company profile saved");
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Failed to save company profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Company Profile">
      <Card className="max-w-2xl mx-auto p-6">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Company name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_id"
                rules={{ required: "Registration/Tax ID is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration/Tax ID</FormLabel>
                    <FormControl>
                      <Input placeholder="123-ABC-456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                rules={{ required: "Address is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Company address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </Card>
    </AppLayout>
  );
}
