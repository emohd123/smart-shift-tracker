import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CertificateType } from "../types/certificate";
import { Award, Briefcase } from "lucide-react";

type CertificateTypeSelectorProps = {
  certificateType: CertificateType;
  setCertificateType: (value: CertificateType) => void;
};

export default function CertificateTypeSelector({ certificateType, setCertificateType }: CertificateTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="certificateType" className="text-sm font-medium">Certificate Type</Label>
      <Select 
        value={certificateType} 
        onValueChange={(value) => setCertificateType(value as CertificateType)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select certificate type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="skills">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <div>
                <div className="font-medium">Skills Certificate</div>
                <div className="text-xs text-muted-foreground">Focus on specific skills and competencies</div>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="work_experience">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <div>
                <div className="font-medium">Work Experience Certificate</div>
                <div className="text-xs text-muted-foreground">Comprehensive employment history and hours</div>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        {certificateType === "skills" 
          ? "Generates a certificate highlighting skills gained and performance in specific roles."
          : "Creates a comprehensive work history certificate with detailed timesheet data and employment verification."
        }
      </p>
    </div>
  );
}