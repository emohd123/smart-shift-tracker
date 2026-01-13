import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormData } from "./types";
import { countries } from "@/lib/countries";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { validateIBAN, formatIBAN, cleanIBAN } from "@/utils/ibanValidation";

interface BankAccountStepProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setFormData: (data: FormData) => void;
  errors?: Record<string, string>;
}

export function BankAccountStep({ formData, handleChange, setFormData, errors }: BankAccountStepProps) {
  const [ibanError, setIbanError] = useState<string | undefined>();

  // IBAN validation and formatting handler
  const handleIBANChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleaned = cleanIBAN(rawValue);
    const formatted = formatIBAN(cleaned);
    
    // Update form data with cleaned value
    setFormData({
      ...formData,
      ibanNumber: cleaned
    });

    // Validate IBAN
    if (cleaned.length > 0) {
      const validation = validateIBAN(cleaned);
      if (!validation.valid) {
        setIbanError(validation.error);
      } else {
        setIbanError(undefined);
      }
    } else {
      setIbanError(undefined);
    }
  };

  // Handle bank country change
  const handleBankCountryChange = (value: string) => {
    setFormData({
      ...formData,
      bankCountry: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 mb-4">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-medium">Bank Account Information</h3>
          <p className="text-sm text-muted-foreground">
            Required for receiving salary payments. Your bank details are encrypted and secure.
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Payments will be sent directly to this bank account based on your completed timesheets.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bank_account_holder_name">
            Account Holder Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bank_account_holder_name"
            name="bank_account_holder_name"
            type="text"
            placeholder="John Doe"
            value={formData.bankAccountHolderName || ''}
            onChange={handleChange}
            required
            className="h-11"
          />
          {errors?.bank_account_holder_name && (
            <p className="text-sm text-red-500">{errors.bank_account_holder_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="iban_number">
            IBAN Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="iban_number"
            name="iban_number"
            type="text"
            placeholder="BH02 CITI 0000 1077 1816 11"
            value={formData.ibanNumber ? formatIBAN(formData.ibanNumber) : ''}
            onChange={handleIBANChange}
            required
            className="h-11 font-mono"
            maxLength={42} // 34 chars + spaces
            pattern="[A-Z0-9\s]{15,42}"
          />
          <p className="text-xs text-muted-foreground">
            International Bank Account Number (15-34 characters, no spaces required)
          </p>
          {(ibanError || errors?.iban_number) && (
            <p className="text-sm text-red-500">{ibanError || errors?.iban_number}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_name">
            Bank Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bank_name"
            name="bank_name"
            type="text"
            placeholder="e.g., Bank of Bahrain and Kuwait"
            value={formData.bankName || ''}
            onChange={handleChange}
            required
            className="h-11"
          />
          {errors?.bank_name && (
            <p className="text-sm text-red-500">{errors.bank_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_country">
            Bank Country <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.bankCountry || 'BH'}
            onValueChange={handleBankCountryChange}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.bank_country && (
            <p className="text-sm text-red-500">{errors.bank_country}</p>
          )}
        </div>
      </div>
    </div>
  );
}
