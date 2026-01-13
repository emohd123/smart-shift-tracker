
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GenderType } from "@/types/database";

export function PersonalInfoStep({ 
  formData, 
  handleChange, 
  setFormData 
}: { 
  formData: any; 
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFormData: (data: any) => void; 
}) {
  return (
    <div className="grid gap-4">
      <h3 className="text-lg font-medium">Personal Information</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            name="nationality"
            type="text"
            value={formData.nationality}
            onChange={handleChange}
            placeholder="Your nationality"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            min="18"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={handleChange}
            placeholder="+123 456 7890"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select 
            name="gender" 
            value={formData.gender} 
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GenderType.Male}>Male</SelectItem>
              <SelectItem value={GenderType.Female}>Female</SelectItem>
              <SelectItem value={GenderType.Other}>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            placeholder="Height in cm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder="Weight in kg"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          type="text"
          value={formData.address}
          onChange={handleChange}
          placeholder="Your address"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isStudent"
          name="isStudent"
          checked={formData.isStudent || false}
          onCheckedChange={(checked) => setFormData({ ...formData, isStudent: !!checked })}
        />
        <Label htmlFor="isStudent">I am a student</Label>
      </div>
    </div>
  );
}
