import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserRole } from "@/types/database";

type ContractTemplateRow = {
  id: string;
  company_id: string;
  title: string;
  body_markdown: string;
  version: number;
  is_active: boolean;
  updated_at: string;
};

export default function CompanyContract() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<ContractTemplateRow | null>(null);
  const [title, setTitle] = useState("Company Contract");
  const [body, setBody] = useState(
    `## Contract Terms\n\nThis contract governs engagement between the Company and the Promoter.\n\n- Work will be performed as assigned per shift details.\n- Payment terms are defined by the Company.\n- The Promoter agrees to comply with company policies and instructions.\n\nBy accepting, the Promoter confirms they have read and agree to these terms.`
  );

  const canManage = user?.role === UserRole.Company || user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;

  const preview = useMemo(() => body.trim(), [body]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from("company_contract_templates")
          .select("id, company_id, title, body_markdown, version, is_active, updated_at")
          .eq("company_id", user.id)
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setTemplate(data);
          setTitle(data.title || "Company Contract");
          setBody(data.body_markdown || "");
        } else {
          setTemplate(null);
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Failed to load contract template");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!title.trim() || !body.trim()) {
      toast.error("Title and contract body are required");
      return;
    }
    setSaving(true);
    try {
      if (template?.id) {
        const { error } = await (supabase as any)
          .from("company_contract_templates")
          .update({
            title: title.trim(),
            body_markdown: body.trim(),
            version: (template.version || 1) + 1,
            is_active: true,
          })
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from("company_contract_templates")
          .insert({
            company_id: user.id,
            title: title.trim(),
            body_markdown: body.trim(),
            version: 1,
            is_active: true,
            created_by: user.id,
          })
          .select("id, company_id, title, body_markdown, version, is_active, updated_at")
          .maybeSingle();
        if (error) throw error;
        if (data) setTemplate(data);
      }

      toast.success("Contract template saved");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save contract template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Company Contract">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Contract Template</CardTitle>
            <CardDescription>
              Promoters will sign this contract once (per company) before starting their first shift with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canManage ? (
              <div className="text-muted-foreground">Company access required.</div>
            ) : loading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : (
              <>
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Title</div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Contract Body (Markdown / Plain text)</div>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="min-h-[340px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Preview</div>
                    <div className="min-h-[340px] rounded-md border bg-background p-4 whitespace-pre-wrap text-sm">
                      {preview}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {template ? `Version ${template.version} • Last updated ${new Date(template.updated_at).toLocaleString()}` : "No template saved yet"}
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save Template"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


