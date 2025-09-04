import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CompanyFormData } from "./companyTypes";

interface CompanyDetailsStepProps {
  formData: CompanyFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CompanyDetailsStep({ formData, handleChange }: CompanyDetailsStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Company Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          placeholder="Your Company Ltd."
          value={formData.companyName}
          onChange={handleChange}
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessAddress">Business Address *</Label>
        <Textarea
          id="businessAddress"
          name="businessAddress"
          placeholder="Full business address including street, city, postal code"
          value={formData.businessAddress}
          onChange={handleChange}
          required
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessCountry">Country *</Label>
        <select
          id="businessCountry"
          name="businessCountry"
          value={formData.businessCountry}
          onChange={handleChange}
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a country</option>
          <option value="AE">United Arab Emirates</option>
          <option value="SA">Saudi Arabia</option>
          <option value="QA">Qatar</option>
          <option value="KW">Kuwait</option>
          <option value="BH">Bahrain</option>
          <option value="OM">Oman</option>
          <option value="JO">Jordan</option>
          <option value="LB">Lebanon</option>
          <option value="EG">Egypt</option>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="IT">Italy</option>
          <option value="ES">Spain</option>
          <option value="NL">Netherlands</option>
          <option value="SE">Sweden</option>
          <option value="NO">Norway</option>
          <option value="DK">Denmark</option>
          <option value="CH">Switzerland</option>
          <option value="SG">Singapore</option>
          <option value="HK">Hong Kong</option>
          <option value="JP">Japan</option>
          <option value="KR">South Korea</option>
          <option value="IN">India</option>
          <option value="PH">Philippines</option>
          <option value="TH">Thailand</option>
          <option value="MY">Malaysia</option>
          <option value="ID">Indonesia</option>
          <option value="VN">Vietnam</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessRegistrationId">Business Registration ID</Label>
        <Input
          id="businessRegistrationId"
          name="businessRegistrationId"
          type="text"
          placeholder="Company registration number or license ID"
          value={formData.businessRegistrationId}
          onChange={handleChange}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Helps verify your business legitimacy
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPerson">Primary Contact Person</Label>
        <Input
          id="contactPerson"
          name="contactPerson"
          type="text"
          placeholder="Full name of the main contact person"
          value={formData.contactPerson}
          onChange={handleChange}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Business Phone Number</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          placeholder="+971 50 123 4567"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="h-11"
        />
      </div>
    </div>
  );
}