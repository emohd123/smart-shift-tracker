import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, FileText, BarChart, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CertificateCustomizerProps = {
  template: string;
  setTemplate: (template: string) => void;
  includeDescription: boolean;
  setIncludeDescription: (include: boolean) => void;
  includeMetrics: boolean;
  setIncludeMetrics: (include: boolean) => void;
  customMessage: string;
  setCustomMessage: (message: string) => void;
};

export function CertificateCustomizer({
  template,
  setTemplate,
  includeDescription,
  setIncludeDescription,
  includeMetrics,
  setIncludeMetrics,
  customMessage,
  setCustomMessage
}: CertificateCustomizerProps) {
  const templates = [
    { 
      id: "professional", 
      name: "Professional", 
      description: "Clean, corporate design with company branding",
      color: "blue"
    },
    { 
      id: "modern", 
      name: "Modern", 
      description: "Contemporary design with bold typography",
      color: "purple" 
    },
    { 
      id: "classic", 
      name: "Classic", 
      description: "Traditional certificate layout with elegant styling",
      color: "green"
    },
    { 
      id: "minimal", 
      name: "Minimal", 
      description: "Simple, clean design focused on content",
      color: "gray"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Certificate Template
          </CardTitle>
          <CardDescription>
            Choose the visual style for your certificate
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  template === tmpl.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setTemplate(tmpl.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{tmpl.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tmpl.description}
                    </p>
                  </div>
                  <Badge 
                    variant={template === tmpl.id ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {template === tmpl.id ? "Selected" : "Select"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Content Options
          </CardTitle>
          <CardDescription>
            Customize what information to include in your certificate
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Include Performance Metrics
              </Label>
              <p className="text-sm text-muted-foreground">
                Add detailed statistics and performance data
              </p>
            </div>
            <Switch
              checked={includeMetrics}
              onCheckedChange={setIncludeMetrics}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Include Work Descriptions
              </Label>
              <p className="text-sm text-muted-foreground">
                Add detailed descriptions of work performed
              </p>
            </div>
            <Switch
              checked={includeDescription}
              onCheckedChange={setIncludeDescription}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Custom Message
          </CardTitle>
          <CardDescription>
            Add a personal message or dedication to your certificate
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Textarea
            placeholder="Add a custom message, dedication, or additional information... (optional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {customMessage.length}/200 characters
          </p>
        </CardContent>
      </Card>
    </div>
  );
}