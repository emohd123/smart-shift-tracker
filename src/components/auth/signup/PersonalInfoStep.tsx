
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { FormData } from "./types";

interface PersonalInfoStepProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function PersonalInfoStep({ formData, handleChange, setFormData }: PersonalInfoStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Personal Details</h3>
      
      <div className="space-y-2">
        <Label htmlFor="nationality">Nationality</Label>
        <Select
          value={formData.nationality}
          onValueChange={(value) => {
            console.log("Selected nationality:", value);
            setFormData(prev => ({ ...prev, nationality: value }));
          }}
        >
          <SelectTrigger id="nationality" className="h-11">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age (18+)</Label>
          <Input
            id="age"
            name="age"
            type="number"
            min="18"
            placeholder="21"
            value={formData.age}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="+1 123 456 7890"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => setFormData({...formData, gender: value})}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            name="height"
            type="number"
            placeholder="175"
            value={formData.height}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            placeholder="70"
            value={formData.weight}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            id="isStudent"
            name="isStudent"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={formData.isStudent}
            onChange={handleChange}
          />
          <Label htmlFor="isStudent">Are you a student?</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          name="address"
          rows={3}
          placeholder="Enter your full address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankDetails">Bank Account Details (Optional)</Label>
        <textarea
          id="bankDetails"
          name="bankDetails"
          rows={3}
          placeholder="Enter your bank account details for payment processing"
          value={formData.bankDetails}
          onChange={handleChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <p className="text-xs text-muted-foreground">
          This information is securely stored and only accessible to admins for payment processing.
        </p>
      </div>
    </div>
  );
}
