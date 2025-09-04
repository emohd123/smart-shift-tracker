
import { Label } from "@/components/ui/label";
import { PasswordField } from "./PasswordField";

interface PasswordFieldsProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
}

export function PasswordFields({ 
  password, 
  setPassword, 
  confirmPassword, 
  setConfirmPassword 
}: PasswordFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <PasswordField
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>
    </>
  );
}
