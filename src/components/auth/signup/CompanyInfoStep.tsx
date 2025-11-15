
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CompanyInfoStep({ 
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
      <h3 className="text-lg font-medium">Company Information</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName || ''}
            onChange={handleChange}
            placeholder="Your company name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companyRegistrationId">Registration ID</Label>
          <Input
            id="companyRegistrationId"
            name="companyRegistrationId"
            type="text"
            value={formData.companyRegistrationId || ''}
            onChange={handleChange}
            placeholder="Company registration number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
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
          <Label htmlFor="companyWebsite">Website</Label>
          <Input
            id="companyWebsite"
            name="companyWebsite"
            type="url"
            value={formData.companyWebsite || ''}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companyIndustry">Industry</Label>
          <Select 
            name="companyIndustry" 
            value={formData.companyIndustry || ''} 
            onValueChange={(value) => setFormData({ ...formData, companyIndustry: value })}
          >
            <SelectTrigger id="companyIndustry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="hospitality">Hospitality</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companySize">Company Size</Label>
          <Select 
            name="companySize" 
            value={formData.companySize || ''} 
            onValueChange={(value) => setFormData({ ...formData, companySize: value })}
          >
            <SelectTrigger id="companySize">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="500+">500+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          name="address"
          type="text"
          value={formData.address || ''}
          onChange={handleChange}
          placeholder="Company address"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="companyDescription">Description</Label>
        <Textarea
          id="companyDescription"
          name="companyDescription"
          value={formData.companyDescription || ''}
          onChange={handleChange}
          placeholder="Brief description of your company"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
