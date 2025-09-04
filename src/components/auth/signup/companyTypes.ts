export interface CompanyFormData {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  businessAddress: string;
  businessCountry: string;
  businessRegistrationId: string;
  contactPerson: string;
  phoneNumber: string;
}

export interface CompanyFileData {
  companyLogo: File | null;
  businessDocument: File | null;
  companyLogoPreview: string | null;
  businessDocumentPreview: string | null;
}