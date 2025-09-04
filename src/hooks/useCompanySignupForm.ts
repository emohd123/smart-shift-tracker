import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyFormData, CompanyFileData } from "@/components/auth/signup/companyTypes";

const initialFormData: CompanyFormData = {
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  businessAddress: "",
  businessCountry: "",
  businessRegistrationId: "",
  contactPerson: "",
  phoneNumber: "",
};

const initialFileData: CompanyFileData = {
  companyLogo: null,
  businessDocument: null,
  companyLogoPreview: null,
  businessDocumentPreview: null,
};

export function useCompanySignupForm() {
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [fileData, setFileData] = useState<CompanyFileData>(initialFileData);
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("account");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is handled by individual file upload functions in the component
  };

  const validateForm = (): boolean => {
    setFormError("");
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setFormError("Please fill in all required account fields");
      setActiveSection("account");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      setActiveSection("account");
      return false;
    }

    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      setActiveSection("account");
      return false;
    }

    if (!formData.companyName || !formData.businessAddress || !formData.businessCountry) {
      setFormError("Please fill in all required company fields");
      setActiveSection("company");
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setUploadingFiles(true);
    
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'company_admin',
            company_name: formData.companyName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      let companyLogoUrl = null;
      let businessDocumentUrl = null;

      // Upload files if provided
      if (fileData.companyLogo) {
        const logoPath = `companies/${authData.user.id}/logo-${Date.now()}.${fileData.companyLogo.name.split('.').pop()}`;
        companyLogoUrl = await uploadFile(fileData.companyLogo, 'company-assets', logoPath);
      }

      if (fileData.businessDocument) {
        const docPath = `companies/${authData.user.id}/business-doc-${Date.now()}.${fileData.businessDocument.name.split('.').pop()}`;
        businessDocumentUrl = await uploadFile(fileData.businessDocument, 'company-assets', docPath);
      }

      // Create tenant (company) record
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          id: authData.user.id, // Use user ID as tenant ID for companies
          name: formData.companyName,
          type: 'company',
          settings: {
            business_address: formData.businessAddress,
            business_country: formData.businessCountry,
            business_registration_id: formData.businessRegistrationId,
            contact_person: formData.contactPerson,
            phone_number: formData.phoneNumber,
            company_logo_url: companyLogoUrl,
            business_document_url: businessDocumentUrl,
          }
        });

      if (tenantError) throw tenantError;

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.contactPerson || formData.companyName,
          email: formData.email,
          role: 'company_admin',
          phone_number: formData.phoneNumber,
        });

      if (profileError) throw profileError;

      // Create tenant membership
      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert({
          user_id: authData.user.id,
          tenant_id: authData.user.id,
          role: 'company_admin',
          status: 'active'
        });

      if (membershipError) throw membershipError;

      setIsSuccess(true);
      
    } catch (error) {
      console.error('Company signup error:', error);
      setFormError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return {
    formData,
    fileData,
    handleChange,
    handleFileChange,
    formError,
    handleSubmit,
    isSuccess,
    loading,
    uploadingFiles,
    setFileData,
    activeSection,
    setActiveSection
  };
}