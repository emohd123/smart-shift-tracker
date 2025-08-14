import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Upload, Eye, Save, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type StampConfig = {
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  logoUrl: string;
  stampMessage: string;
  enableDigitalSignature: boolean;
  signaturePosition: 'bottom-left' | 'bottom-right' | 'bottom-center';
  stampOpacity: number;
};

export function AdminStampConfig() {
  const [config, setConfig] = useState<StampConfig>({
    companyName: "Professional Certification Authority",
    companyWebsite: "https://yourcompany.com",
    companyEmail: "certificates@yourcompany.com",
    companyPhone: "+1 (555) 123-4567",
    logoUrl: "",
    stampMessage: "This certificate is officially verified and authenticated.",
    enableDigitalSignature: true,
    signaturePosition: 'bottom-right',
    stampOpacity: 0.8
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_stamp_configs')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error("Failed to load stamp config:", error);
        return;
      }

      if (data) {
        setConfig({
          companyName: data.company_name,
          companyWebsite: data.company_website || '',
          companyEmail: data.company_email || '',
          companyPhone: data.company_phone || '',
          logoUrl: data.logo_url || '',
          stampMessage: data.stamp_message,
          enableDigitalSignature: data.enable_digital_signature,
          signaturePosition: data.signature_position as StampConfig['signaturePosition'],
          stampOpacity: data.stamp_opacity
        });
      }
    } catch (error) {
      console.error("Failed to load stamp config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_stamp_configs')
        .upsert({
          company_name: config.companyName,
          company_website: config.companyWebsite,
          company_email: config.companyEmail,
          company_phone: config.companyPhone,
          logo_url: config.logoUrl,
          stamp_message: config.stampMessage,
          enable_digital_signature: config.enableDigitalSignature,
          signature_position: config.signaturePosition,
          stamp_opacity: config.stampOpacity,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Stamp configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save stamp config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setLoading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(`logos/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(`logos/${fileName}`);

      setConfig(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Stamp Configuration</CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
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
            Company Information
          </CardTitle>
          <CardDescription>
            Configure your company details that appear on all certificates
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={config.companyName}
                onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Website</Label>
              <Input
                id="companyWebsite"
                type="url"
                value={config.companyWebsite}
                onChange={(e) => setConfig(prev => ({ ...prev, companyWebsite: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={config.companyEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, companyEmail: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={config.companyPhone}
                onChange={(e) => setConfig(prev => ({ ...prev, companyPhone: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Company Logo & Branding
          </CardTitle>
          <CardDescription>
            Upload your company logo and configure branding elements
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="max-w-xs"
              />
              {config.logoUrl && (
                <div className="flex items-center gap-2">
                  <img 
                    src={config.logoUrl} 
                    alt="Company Logo" 
                    className="h-12 w-12 object-contain border rounded"
                  />
                  <Badge variant="secondary">Current Logo</Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stampMessage">Digital Stamp Message</Label>
            <Textarea
              id="stampMessage"
              value={config.stampMessage}
              onChange={(e) => setConfig(prev => ({ ...prev, stampMessage: e.target.value }))}
              rows={2}
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
                Add a digital signature to all generated certificates
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
          Save Configuration
        </Button>
        
        <Button variant="outline" onClick={() => toast.info("Preview functionality coming soon!")}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Stamp
        </Button>
      </div>
    </div>
  );
}