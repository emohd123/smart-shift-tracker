import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { useState } from "react";

interface ContractPreviewStepProps {
  contractPreview: string;
  formData: any;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ContractPreviewStep({
  contractPreview,
  formData,
  onNext,
  onPrevious
}: ContractPreviewStepProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(contractPreview);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    // Create a blob from the HTML
    const blob = new Blob([contractPreview], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${formData.title?.replace(/\s+/g, "-")}-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>👁️ Contract Preview</CardTitle>
            <CardDescription>
              Review how the contract will appear to promoters
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
              srcDoc={contractPreview}
              title="Contract Preview"
              className="w-full h-full border-none"
              style={{ minHeight: isFullscreen ? "100vh" : "600px" }}
            />
          </div>
        </div>

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
