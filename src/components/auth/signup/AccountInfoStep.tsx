
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormData } from "./types";
import { PasswordField } from "../PasswordField";

interface AccountInfoStepProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function AccountInfoStep({ formData, handleChange }: AccountInfoStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Account Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="yourname@gmail.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Use a valid email from Gmail, Yahoo, Outlook, or other recognized providers
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
