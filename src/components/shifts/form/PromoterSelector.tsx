
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromoterOption } from "../ShiftForm";

type PromoterSelectorProps = {
  promoters: PromoterOption[];
  selectedPromoterId: string;
  onSelect: (value: string) => void;
  loading: boolean;
};

export default function PromoterSelector({
  promoters,
  selectedPromoterId,
  onSelect,
  loading
}: PromoterSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="promoter">Assign Promoter (Optional)</Label>
      <Select 
        value={selectedPromoterId || "none"} 
        onValueChange={onSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a promoter" />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>Loading promoters...</SelectItem>
          ) : promoters.length === 0 ? (
            <SelectItem value="none" disabled>No promoters available</SelectItem>
          ) : (
            <>
              <SelectItem value="none">-- None --</SelectItem>
              {promoters.map((promoter) => (
                <SelectItem key={promoter.id} value={promoter.id}>
                  {promoter.full_name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
