import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

type BasicInfoFieldsProps = {
  title: string;
  location: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function BasicInfoFields({ 
  title, 
  location, 
  onInputChange 
}: BasicInfoFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="title">Shift Title</Label>
          <HelpTooltip content={tooltips.company.shifts.title} />
        </div>
        <Input
          id="title"
          name="title"
          placeholder="Enter shift title"
          value={title}
          onChange={onInputChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="location">Location</Label>
          <HelpTooltip content={tooltips.company.shifts.location} />
        </div>
        <Input
          id="location"
          name="location"
          placeholder="Enter location"
          value={location}
          onChange={onInputChange}
          required
        />
      </div>
    </>
  );
}
