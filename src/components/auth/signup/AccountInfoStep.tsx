
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormData } from "./types";

interface AccountInfoStepProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
          placeholder="yourname@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="h-11"
        />
      </div>
    </div>
  );
}
