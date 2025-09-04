import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Building2, FileText } from "lucide-react";
import { CompanyFileData } from "./companyTypes";

interface CompanyAssetsStepProps {
  fileData: CompanyFileData;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setLogoFile: (file: File | null) => void;
  setLogoPreview: (preview: string | null) => void;
  setBusinessDoc: (file: File | null) => void;
  setBusinessDocPreview: (preview: string | null) => void;
}

export function CompanyAssetsStep({
  fileData,
  handleFileChange,
  setLogoFile,
  setLogoPreview,
  setBusinessDoc,
  setBusinessDocPreview
}: CompanyAssetsStepProps) {
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File size must be less than 5MB");
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBusinessDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File size must be less than 10MB");
        return;
      }
      
      setBusinessDoc(file);
      setBusinessDocPreview(file.name);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const removeBusinessDoc = () => {
    setBusinessDoc(null);
    setBusinessDocPreview(null);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Company Assets</h3>
      <p className="text-sm text-muted-foreground">
        Upload your company logo and business documents to complete your profile
      </p>
      
      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo (PNG, JPG, SVG - Max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!fileData.companyLogoPreview ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                id="companyLogo"
                name="companyLogo"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label htmlFor="companyLogo" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Click to upload logo</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop your logo here
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center justify-center p-4 border rounded-lg">
                <img
                  src={fileData.companyLogoPreview}
                  alt="Company logo preview"
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={removeLogoFile}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Registration Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Registration Document
          </CardTitle>
          <CardDescription>
            Upload your business license or registration certificate (PDF, DOC, DOCX - Max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!fileData.businessDocumentPreview ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                id="businessDocument"
                name="businessDocument"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleBusinessDocUpload}
                className="hidden"
              />
              <label htmlFor="businessDocument" className="cursor-pointer">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Click to upload document</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, or DOCX files only
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{fileData.businessDocumentPreview}</p>
                  <p className="text-sm text-muted-foreground">Document uploaded</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeBusinessDoc}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="mb-2"><strong>Note:</strong> Both uploads are optional but recommended for:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Enhanced company profile credibility</li>
          <li>Better trust from potential part-time workers</li>
          <li>Faster verification process</li>
        </ul>
      </div>
    </div>
  );
}