import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Eye, Save, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type StampConfig = {
  stampMessage: string;
  enableDigitalSignature: boolean;
  signaturePosition: 'bottom-left' | 'bottom-right' | 'bottom-center';
  stampOpacity: number;
  customFooterText: string;
};

export function CompanyStampConfig() {
  const [config, setConfig] = useState<StampConfig>({
    stampMessage: "This certificate is officially verified and authenticated.",
    enableDigitalSignature: true,
    signaturePosition: 'bottom-right',
    stampOpacity: 0.8,
    customFooterText: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get company profile first
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!companyProfile) return;

      const { data, error } = await supabase
        .from('company_certificate_configs')
        .select('*')
        .eq('company_id', companyProfile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error("Failed to load certificate config:", error);
        return;
      }

      if (data) {
        setConfig({
          stampMessage: data.stamp_message || '',
          enableDigitalSignature: data.enable_digital_signature ?? true,
          signaturePosition: data.signature_position as StampConfig['signaturePosition'],
          stampOpacity: data.stamp_opacity || 0.8,
          customFooterText: data.custom_footer_text || ''
        });
      }
    } catch (error) {
      console.error("Failed to load certificate config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get company profile
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!companyProfile) {
        toast.error("Company profile not found");
        return;
      }

      const { error } = await supabase
        .from('company_certificate_configs')
        .upsert([{
          company_id: companyProfile.user_id,
          stamp_message: config.stampMessage,
          enable_digital_signature: config.enableDigitalSignature,
          signature_position: config.signaturePosition,
          stamp_opacity: config.stampOpacity,
          custom_footer_text: config.customFooterText,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'company_id'
        });

      if (error) throw error;
      
      toast.success("Certificate settings saved successfully!");
    } catch (error) {
      console.error("Failed to save certificate config:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Branding Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Certificate Branding
          </CardTitle>
          <CardDescription>
            Customize how your company branding appears on work certificates
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stampMessage">Digital Stamp Message</Label>
            <Textarea
              id="stampMessage"
              value={config.stampMessage}
              onChange={(e) => setConfig(prev => ({ ...prev, stampMessage: e.target.value }))}
              rows={2}
              placeholder="This certificate is officially verified and authenticated."
            />
            <p className="text-sm text-muted-foreground">
              This message appears on all certificates issued by your company
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customFooter">Custom Footer Text (Optional)</Label>
            <Textarea
              id="customFooter"
              value={config.customFooterText}
              onChange={(e) => setConfig(prev => ({ ...prev, customFooterText: e.target.value }))}
              rows={2}
              placeholder="Additional information or legal disclaimer..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Digital Signature Settings
          </CardTitle>
          <CardDescription>
            Configure how the digital signature appears on certificates
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Digital Signature</Label>
              <p className="text-sm text-muted-foreground">
                Add a digital signature seal to all generated certificates
              </p>
            </div>
            <Switch
              checked={config.enableDigitalSignature}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableDigitalSignature: checked }))}
            />
          </div>
          
          {config.enableDigitalSignature && (
            <>
              <div className="space-y-2">
                <Label>Signature Position</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'bottom-left', label: 'Bottom Left' },
                    { value: 'bottom-center', label: 'Bottom Center' },
                    { value: 'bottom-right', label: 'Bottom Right' }
                  ].map((position) => (
                    <Button
                      key={position.value}
                      variant={config.signaturePosition === position.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        signaturePosition: position.value as StampConfig['signaturePosition']
                      }))}
                    >
                      {position.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Stamp Opacity: {Math.round(config.stampOpacity * 100)}%</Label>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={config.stampOpacity}
                  onChange={(e) => setConfig(prev => ({ ...prev, stampOpacity: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={saveConfig} disabled={saving} className="flex-1">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
        
        <Button variant="outline" onClick={() => toast.info("Preview functionality coming soon!")}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    </div>
  );
}

export default CompanyStampConfig;
