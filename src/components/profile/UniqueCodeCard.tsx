import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUniqueCodeGeneration } from "@/hooks/useUniqueCodeGeneration";
import QRCode from "react-qr-code";
import type { User } from "@/context/AuthContext";

interface UniqueCodeCardProps {
  user: User | null;
  onCodeGenerated?: (code: string) => void;
}

export function UniqueCodeCard({ user, onCodeGenerated }: UniqueCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const { generateCode, generating } = useUniqueCodeGeneration();
  const [showQR, setShowQR] = useState(false);
  const [localCode, setLocalCode] = useState(user?.unique_code);

  // Auto-generate code if missing
  useEffect(() => {
    if (!localCode && !generating) {
      const autoGenerate = async () => {
        const code = await generateCode();
        if (code) {
          setLocalCode(code);
          onCodeGenerated?.(code);
        }
      };
      autoGenerate();
    }
  }, [localCode, generating]);

  const handleCopy = async () => {
    if (localCode) {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!localCode || generating) {
    return (
      <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Your Unique Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please wait while we create your unique promoter code...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle>Your Unique Promoter Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-background p-4 rounded-lg border-2 border-primary/20">
            <p className="text-3xl font-mono font-bold text-center tracking-widest text-primary">
              {localCode}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowQR(!showQR)}>
            <QrCode className="h-4 w-4" />
          </Button>
        </div>

        {showQR && (
          <div className="flex justify-center p-4 bg-background rounded-lg">
            <QRCode value={localCode} size={200} />
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Share this code with companies so they can assign you to shifts
        </p>
      </CardContent>
    </Card>
  );
}
