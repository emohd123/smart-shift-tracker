import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Download, Printer, Edit, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContractPreviewStepProps {
  contractPreview: string;
  contractTitle?: string;
  contractBody?: string;
  formData: any;
  onNext: () => void;
  onPrevious: () => void;
  onContractChange?: (title: string, body: string) => void;
}

export default function ContractPreviewStep({
  contractPreview,
  contractTitle: initialTitle,
  contractBody: initialBody,
  formData,
  onNext,
  onPrevious,
  onContractChange
}: ContractPreviewStepProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");
  const [contractTitle, setContractTitle] = useState(initialTitle || "Shift Contract");
  const [contractBody, setContractBody] = useState(initialBody || contractPreview);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update local state when props change
  useEffect(() => {
    if (initialTitle) setContractTitle(initialTitle);
    if (initialBody) setContractBody(initialBody);
  }, [initialTitle, initialBody]);

  // Notify parent of changes
  useEffect(() => {
    if (onContractChange) {
      onContractChange(contractTitle, contractBody);
    }
  }, [contractTitle, contractBody, onContractChange]);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=900,height=700");
    if (printWindow) {
      const contentToPrint = contractBody || contractPreview;
      printWindow.document.write(contentToPrint);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    const contentToDownload = contractBody || contractPreview;
    const blob = new Blob([contentToDownload], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${formData.title?.replace(/\s+/g, "-")}-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayContent = contractBody || contractPreview;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contract Editor</CardTitle>
            <CardDescription>
              Edit the contract that will be shown to promoters for approval
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Contract
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="contract-title" className="text-sm font-medium">
                Contract Title *
              </label>
              <Input
                id="contract-title"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                placeholder="e.g., Shift Contract, Work Agreement"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contract-body" className="text-sm font-medium">
                Contract Content (HTML) *
              </label>
              <Textarea
                id="contract-body"
                value={contractBody}
                onChange={(e) => setContractBody(e.target.value)}
                placeholder="Enter contract content in HTML format..."
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can edit the HTML content. The contract will be shown to promoters when they accept.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {/* Contract Preview Frame */}
            <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
              <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Contract Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
              </div>
              <div className={`overflow-auto ${isFullscreen ? "h-screen" : "h-[600px]"}`}>
                <iframe
                  srcDoc={displayContent}
                  title="Contract Preview"
                  className="w-full h-full border-none"
                  style={{ minHeight: isFullscreen ? "100vh" : "600px" }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button onClick={onPrevious} variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Payment
          </Button>
          <Button onClick={onNext} size="lg" className="gap-2">
            Assign Promoters
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
