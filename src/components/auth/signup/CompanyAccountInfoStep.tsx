import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CompanyFormData } from "./companyTypes";
import { PasswordField } from "../PasswordField";

interface CompanyAccountInfoStepProps {
  formData: CompanyFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function CompanyAccountInfoStep({ formData, handleChange }: CompanyAccountInfoStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Account Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="email">Company Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="company@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          This will be used for account login and notifications
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
      </div>
    </div>
  );
}