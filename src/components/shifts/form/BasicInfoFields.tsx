
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <Label htmlFor="title">Shift Title</Label>
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
        <Label htmlFor="location">Location</Label>
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
