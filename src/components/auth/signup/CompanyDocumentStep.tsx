
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, XCircle, Image } from "lucide-react";
import { FileData } from "./types";
import { useState } from "react";

interface CompanyDocumentStepProps {
  fileData: FileData;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, fileType: 'companyLogo' | 'businessDocument') => void;
  setFileData: (data: any) => void;
}

export function CompanyDocumentStep({
  fileData,
  handleFileChange,
  setFileData,
}: CompanyDocumentStepProps) {
  const { companyLogoPreview, businessDocumentPreview, companyLogo, businessDocument } = fileData;
  const [logoError, setLogoError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  
  const isDocumentPDF = businessDocument?.type === 'application/pdf';

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      setLogoError("Please upload a valid image (JPG, PNG, WEBP)");
      return;
    }
    
    if (file.size > maxSize) {
      setLogoError("File size must be less than 2MB");
      return;
    }

    setLogoError(null);
    handleFileChange(e, 'companyLogo');
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      setDocumentError("Please upload a valid image (JPG, PNG) or PDF file");
      return;
    }
    
    if (file.size > maxSize) {
      setDocumentError("File size must be less than 5MB");
      return;
    }

    setDocumentError(null);
    handleFileChange(e, 'businessDocument');
  };

  const clearLogo = () => {
    if (companyLogoPreview) {
      URL.revokeObjectURL(companyLogoPreview);
    }
    setFileData({ 
      ...fileData, 
      companyLogo: null, 
      companyLogoPreview: null 
    });
  };

  const clearDocument = () => {
    if (businessDocumentPreview && businessDocumentPreview !== '/placeholder.svg') {
      URL.revokeObjectURL(businessDocumentPreview);
    }
    setFileData({ 
      ...fileData, 
      businessDocument: null, 
      businessDocumentPreview: null 
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Company Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload your company logo and documents now or skip and add them later
        </p>
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="companyLogo">Company Logo (Optional)</Label>
        <div className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center ${logoError ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
          {logoError && (
            <div className="flex items-center justify-center text-destructive mb-2 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              {logoError}
            </div>
          )}
          
          {companyLogoPreview ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                <img
                  src={companyLogoPreview}
                  alt="Company Logo Preview"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('companyLogo')?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Logo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearLogo}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="cursor-pointer py-4"
              onClick={() => document.getElementById('companyLogo')?.click()}
            >
              <Image className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Click to upload company logo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WEBP (max. 2MB)</p>
            </div>
          )}
          <Input
            id="companyLogo"
            name="companyLogo"
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label htmlFor="businessDocument">Business Registration Document (Optional)</Label>
        <div className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center ${documentError ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
          {documentError && (
            <div className="flex items-center justify-center text-destructive mb-2 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              {documentError}
            </div>
          )}
          
          {businessDocumentPreview ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                {isDocumentPDF ? (
                  <div className="flex flex-col items-center justify-center h-32 md:h-40 bg-muted">
                    <FileIcon className="h-12 w-12 md:h-16 md:w-16 text-primary mb-2" />
                    <p className="text-sm font-medium truncate max-w-[90%]">{businessDocument?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF document uploaded</p>
                  </div>
                ) : (
                  <img
                    src={businessDocumentPreview}
                    alt="Business Document Preview"
                    className="w-full h-auto object-contain"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('businessDocument')?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Document
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearDocument}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="cursor-pointer py-4"
              onClick={() => document.getElementById('businessDocument')?.click()}
            >
              <FileIcon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Click to upload business registration</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or PDF (max. 5MB)</p>
            </div>
          )}
          <Input
            id="businessDocument"
            name="businessDocument"
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleDocumentChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
