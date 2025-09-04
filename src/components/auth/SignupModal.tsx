import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoleSelectionStep } from "./signup/RoleSelectionStep";
import SignupForm from "./SignupForm";
import { CompanySignupFlow } from "./signup/CompanySignupFlow";

export interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SignupStep = "role-selection" | "part-timer-signup" | "company-signup";
export type UserRole = "part_timer" | "company";

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>("role-selection");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "part_timer") {
      setCurrentStep("part-timer-signup");
    } else {
      setCurrentStep("company-signup");
    }
  };

  const handleBack = () => {
    setCurrentStep("role-selection");
    setSelectedRole(null);
  };

  const handleClose = () => {
    setCurrentStep("role-selection");
    setSelectedRole(null);
    onClose();
  };

  const renderContent = () => {
    switch (currentStep) {
      case "role-selection":
        return <RoleSelectionStep onRoleSelect={handleRoleSelect} onClose={handleClose} />;
      case "part-timer-signup":
        return <SignupForm onBack={handleBack} onSuccess={handleClose} isModal={true} />;
      case "company-signup":
        return <CompanySignupFlow onBack={handleBack} onSuccess={handleClose} />;
      default:
        return <RoleSelectionStep onRoleSelect={handleRoleSelect} onClose={handleClose} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>
            Choose your account type and complete the registration process
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}