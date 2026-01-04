import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, Trash2, FileText, Image, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentFile {
  type: "logo" | "cr_document" | "business_certificate";
  label: string;
  bucket: string;
  maxSize: number;
  acceptTypes: string;
  icon: React.ReactNode;
}

const documents: DocumentFile[] = [
  {
    type: "logo",
    label: "Company Logo",
    bucket: "company_logos",
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptTypes: "image/*",
    icon: <Image className="h-4 w-4" />,
  },
  {
    type: "cr_document",
    label: "Commercial Registration (CR)",
    bucket: "company_documents",
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptTypes: ".pdf,.jpg,.jpeg,.png",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    type: "business_certificate",
    label: "Business Certificate",
    bucket: "company_documents",
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptTypes: ".pdf,.jpg,.jpeg,.png",
    icon: <FileText className="h-4 w-4" />,
  },
];

export default function DocumentsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string | null>>({});

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("logo_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading documents:", error);
      }
      
      // Initialize with logo_url only (other columns will be added after migration)
      setFileUrls({
        logo: data?.logo_url || null,
        cr_document: null,
        business_certificate: null,
      });
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileUpload = async (file: File, docType: DocumentFile) => {
    if (!user?.id) {
      toast.error("Not authenticated");
      return;
    }

    // Validate file size
    if (file.size > docType.maxSize) {
      toast.error(`File size exceeds ${docType.maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    setUploading(prev => ({ ...prev, [docType.type]: true }));
    try {
      const ext = file.name.split(".").pop() || "file";
      const timestamp = Date.now();
      const path = `${user.id}/${docType.type}-${timestamp}.${ext}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(docType.bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from(docType.bucket).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // Update database - For now, only logo_url is in the schema
      // cr_document_url and business_certificate_url will be added after migration
      if (docType.type === "logo") {
        const { error: dbError } = await supabase
          .from("company_profiles")
          .update({ logo_url: publicUrl })
          .eq("user_id", user.id);

        if (dbError) throw dbError;
      } else {
        // TODO: Uncomment after running migration that adds cr_document_url and business_certificate_url
        console.warn(`${docType.type} upload successful but database column not yet migrated`);
      }

      // Update local state
      setFileUrls(prev => ({
        ...prev,
        [docType.type]: publicUrl,
      }));

      toast.success(`${docType.label} uploaded successfully`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${docType.label}`);
    } finally {
      setUploading(prev => ({ ...prev, [docType.type]: false }));
    }
  };

  const handleDeleteDocument = async (docType: DocumentFile) => {
    if (!user?.id) return;

    try {
      const fieldName = docType.type === "logo" ? "logo_url" : 
        docType.type === "cr_document" ? "cr_document_url" : 
        "business_certificate_url";

      const { error } = await supabase
        .from("company_profiles")
        .update({ [fieldName]: null })
        .eq("user_id", user.id);

      if (error) throw error;

      setFileUrls(prev => ({
        ...prev,
        [docType.type]: null,
      }));

      toast.success(`${docType.label} deleted successfully`);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(`Failed to delete ${docType.label}`);
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
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Upload your company documents including logo, commercial registration, and certificates. All files are securely stored and associated with your company account.
        </AlertDescription>
      </Alert>

      {documents.map((doc) => (
        <Card key={doc.type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {doc.icon}
              {doc.label}
            </CardTitle>
            <CardDescription>
              Max size: {doc.maxSize / (1024 * 1024)}MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fileUrls[doc.type] ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">File uploaded</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      asChild
                    >
                      <a href={fileUrls[doc.type]!} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDocument(doc)}
                      disabled={uploading[doc.type]}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "Upload new file" below to replace the existing document.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No file uploaded yet</p>
              </div>
            )}

            <label>
              <input
                type="file"
                accept={doc.acceptTypes}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, doc);
                  // Reset input
                  e.target.value = "";
                }}
                disabled={uploading[doc.type]}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={uploading[doc.type]}
                asChild
              >
                <span>
                  {uploading[doc.type] ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {fileUrls[doc.type] ? "Upload New File" : "Upload File"}
                    </>
                  )}
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
