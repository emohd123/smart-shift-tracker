
import { UseFormReturn } from "react-hook-form";
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
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";

export interface ProfileFormFieldsProps {
  form: UseFormReturn<any>;
  readOnly?: boolean;
}

// Alternative props interface for backward compatibility
export interface LegacyProfileFormFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
  readOnly: boolean;
}

export default function ProfileFormFields({ 
  form, 
  readOnly = false 
}: ProfileFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unique_code">Promoter Code</Label>
          <div className="relative">
            <Input
              id="unique_code"
              type="text"
              value={form.watch("unique_code") || ""}
              readOnly
              disabled
              className="bg-muted/50 font-mono text-lg tracking-wider text-center"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs text-muted-foreground">ID</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Your unique promoter identification code</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            type="text"
            {...form.register("full_name")}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.full_name && (
            <p className="text-sm text-red-500">{form.formState.errors.full_name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            type="text"
            {...form.register("nationality")}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.nationality && (
            <p className="text-sm text-red-500">{form.formState.errors.nationality.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            {...form.register("age", { valueAsNumber: true })}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.age && (
            <p className="text-sm text-red-500">{form.formState.errors.age.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            type="tel"
            {...form.register("phone_number")}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.phone_number && (
            <p className="text-sm text-red-500">{form.formState.errors.phone_number.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select 
            onValueChange={(value) => form.setValue("gender", value as GenderType)}
            defaultValue={form.getValues("gender")}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GenderType.Male}>Male</SelectItem>
              <SelectItem value={GenderType.Female}>Female</SelectItem>
              <SelectItem value={GenderType.Other}>Other</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.gender && (
            <p className="text-sm text-red-500">{form.formState.errors.gender.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            {...form.register("height", { valueAsNumber: true })}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.height && (
            <p className="text-sm text-red-500">{form.formState.errors.height.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            {...form.register("weight", { valueAsNumber: true })}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.weight && (
            <p className="text-sm text-red-500">{form.formState.errors.weight.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            {...form.register("address")}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.address && (
            <p className="text-sm text-red-500">{form.formState.errors.address.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_details">Bank Details</Label>
          <Input
            id="bank_details"
            type="text"
            {...form.register("bank_details")}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {form.formState.errors.bank_details && (
            <p className="text-sm text-red-500">{form.formState.errors.bank_details.message as string}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_student"
          checked={form.watch("is_student") as boolean}
          onCheckedChange={(checked) => form.setValue("is_student", !!checked)}
          disabled={readOnly}
        />
        <Label htmlFor="is_student">I am a student</Label>
      </div>
    </>
  );
}
