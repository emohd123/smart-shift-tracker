import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Shift } from "@/components/shifts/types/ShiftTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string | null;
  shift: Shift;
  contractTitle: string;
  contractBody: string;
  loading?: boolean;
  onAccept: (signatureText: string) => Promise<void>;
};

export default function ContractAcceptanceDialog({
  open,
  onOpenChange,
  companyName,
  shift,
  contractTitle,
  contractBody,
  loading,
  onAccept,
}: Props) {
  const [checked, setChecked] = useState(false);
  const [signature, setSignature] = useState("");
  const canSubmit = checked && signature.trim().length >= 3 && !loading;

  const shiftSummary = useMemo(() => {
    const parts: string[] = [];
    if (companyName) parts.push(companyName);
    parts.push(shift.title);
    parts.push(`${shift.date} • ${shift.startTime} - ${shift.endTime}`);
    if (shift.location) parts.push(shift.location);
    return parts.join(" • ");
  }, [companyName, shift]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Contract required before starting shift</DialogTitle>
          <DialogDescription>
            Please review and accept the company contract once. After accepting, you can start this shift and future shifts for this company.
          </DialogDescription>
        </DialogHeader>

        <Card className="p-3 text-sm text-muted-foreground">
          {shiftSummary}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{contractTitle}</div>
            <div className="h-[360px] overflow-auto rounded-md border bg-background p-4 whitespace-pre-wrap text-sm">
              {contractBody}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Shift details</div>
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Position:</span> {shift.title}</div>
                <div><span className="text-muted-foreground">Date:</span> {shift.date}</div>
                <div><span className="text-muted-foreground">Time:</span> {shift.startTime} - {shift.endTime}</div>
                <div><span className="text-muted-foreground">Location:</span> {shift.location}</div>
                <div><span className="text-muted-foreground">Rate:</span> {shift.payRate}{shift.payRateType ? ` / ${shift.payRateType}` : ""}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="accept" checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
              <Label htmlFor="accept" className="text-sm leading-snug">
                I have read and agree to the contract terms for this company.
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sig">Type your full name as signature</Label>
              <Input
                id="sig"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g., Ahmed Ali"
              />
              <div className="text-xs text-muted-foreground">
                This is a digital signature recorded with timestamp and device information.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onAccept(signature.trim())}
            disabled={!canSubmit}
          >
            {loading ? "Saving…" : "Accept & Start Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


