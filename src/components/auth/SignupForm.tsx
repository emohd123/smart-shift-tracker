
import { useState, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Upload, ArrowLeft, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { countries } from "@/lib/countries";

// Define types for form data
interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  nationality: string;
  age: string;
  phoneNumber: string;
  gender: string;
  height: string;
  weight: string;
  isStudent: boolean;
  address: string;
  bankDetails: string;
}

export default function SignupForm() {
  const { signup, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    nationality: "",
    age: "",
    phoneNumber: "",
    gender: "",
    height: "",
    weight: "",
    isStudent: false,
    address: "",
    bankDetails: "",
  });
  
  // File upload states
  const [idCard, setIdCard] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Form submission state
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (fileType === 'idCard') {
        setIdCard(file);
        if (file.type !== 'application/pdf') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setIdCardPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setIdCardPreview('/placeholder.svg');
        }
      } else {
        setProfilePhoto(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePhotoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Validate form fields
  const validateForm = () => {
    // Reset error
    setFormError(null);
    
    if (step === 1) {
      // Validate basic information
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        setFormError("All fields are required");
        return false;
      }
      
      if (!formData.email.includes('@')) {
        setFormError("Please enter a valid email address");
        return false;
      }
      
      if (formData.password.length < 8) {
        setFormError("Password must be at least 8 characters long");
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setFormError("Passwords do not match");
        return false;
      }
      
      return true;
    } else if (step === 2) {
      // Validate personal details
      if (
        !formData.nationality ||
        !formData.age ||
        !formData.phoneNumber ||
        !formData.gender ||
        !formData.height ||
        !formData.weight ||
        !formData.address
      ) {
        setFormError("All required fields must be filled");
        return false;
      }
      
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18) {
        setFormError("You must be at least 18 years old");
        return false;
      }
      
      if (!/^\d+$/.test(formData.height) || !/^\d+$/.test(formData.weight)) {
        setFormError("Height and weight must be numeric values");
        return false;
      }
      
      return true;
    } else if (step === 3) {
      // Validate file uploads
      if (!idCard) {
        setFormError("Please upload your ID card");
        return false;
      }
      
      if (!profilePhoto) {
        setFormError("Please upload your profile photo");
        return false;
      }
      
      return true;
    }
    
    return false;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateForm()) {
      setStep(prevStep => prevStep + 1);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  // Upload files to Supabase storage
  const uploadFiles = async (userId: string) => {
    try {
      setUploadingFiles(true);
      let idCardUrl = null;
      let profilePhotoUrl = null;
      
      if (idCard) {
        const fileExt = idCard.name.split('.').pop();
        const fileName = `${userId}/id_card.${fileExt}`;
        
        const { data: idCardData, error: idCardError } = await supabase.storage
          .from('id_cards')
          .upload(fileName, idCard);
          
        if (idCardError) throw idCardError;
        idCardUrl = `${fileName}`;
      }
      
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile_photo.${fileExt}`;
        
        const { data: profilePhotoData, error: profilePhotoError } = await supabase.storage
          .from('profile_photos')
          .upload(fileName, profilePhoto);
          
        if (profilePhotoError) throw profilePhotoError;
        profilePhotoUrl = `${fileName}`;
      }
      
      return { idCardUrl, profilePhotoUrl };
    } catch (error: any) {
      console.error("Error uploading files:", error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (userId: string, idCardUrl: string, profilePhotoUrl: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          nationality: formData.nationality,
          age: parseInt(formData.age),
          phone_number: formData.phoneNumber,
          gender: formData.gender as any,
          height: parseInt(formData.height),
          weight: parseInt(formData.weight),
          is_student: formData.isStudent,
          address: formData.address,
          bank_details: formData.bankDetails || null,
          id_card_url: idCardUrl,
          profile_photo_url: profilePhotoUrl,
          verification_status: 'pending'
        })
        .eq('id', userId);
        
      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setFormError(null);
      
      // Register the user
      const { fullName, email, password } = formData;
      const userData = await signup(fullName, email, password);
      
      if (!userData || !userData.id) {
        throw new Error("Failed to create user account");
      }
      
      // Upload files
      const { idCardUrl, profilePhotoUrl } = await uploadFiles(userData.id);
      
      // Update user profile
      await updateUserProfile(userData.id, idCardUrl || '', profilePhotoUrl || '');
      
      setIsSuccess(true);
      toast({
        title: "Registration successful",
        description: "Your account is now pending verification.",
      });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      setFormError(error.message || "Registration failed. Please try again.");
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Clock className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create Your Account</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Register to start your journey as a promoter
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {isSuccess ? (
        <div className="text-center space-y-6">
          <div className="bg-primary/10 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Registration Successful!</h3>
            <p className="text-sm">
              Your account is now pending verification. You will be notified once your account is verified.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="text-primary hover:underline">
              Go to login
            </Link>
            <Link to="/" className="text-primary hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === item
                      ? "bg-primary text-white"
                      : step > item
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              Step {step} of 3
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
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
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(value) => setFormData({...formData, nationality: value})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (18+)</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="18"
                      placeholder="21"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="+1 123 456 7890"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      placeholder="175"
                      value={formData.height}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      placeholder="70"
                      value={formData.weight}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="isStudent"
                      name="isStudent"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.isStudent}
                      onChange={handleChange}
                    />
                    <Label htmlFor="isStudent">Are you a student?</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankDetails">Bank Account Details (Optional)</Label>
                  <textarea
                    id="bankDetails"
                    name="bankDetails"
                    rows={3}
                    placeholder="Enter your bank account details for payment processing"
                    value={formData.bankDetails}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    This information is securely stored and only accessible to admins for payment processing.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Document Upload</h3>
                
                <div className="space-y-4">
                  <Label htmlFor="idCard">ID Card (Required)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {idCardPreview ? (
                      <div className="space-y-4">
                        <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                          <img
                            src={idCardPreview}
                            alt="ID Card Preview"
                            className="h-40 mx-auto object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIdCard(null);
                            setIdCardPreview(null);
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Upload className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex flex-col items-center text-sm text-gray-500">
                          <span>Click to upload your ID card</span>
                          <span className="text-xs">(JPEG, PNG, or PDF, max 5MB)</span>
                        </div>
                        <Input
                          id="idCard"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange(e, 'idCard')}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('idCard')?.click()}
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="profilePhoto">Profile Photo (Required)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {profilePhotoPreview ? (
                      <div className="space-y-4">
                        <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                          <img
                            src={profilePhotoPreview}
                            alt="Profile Photo Preview"
                            className="h-60 mx-auto object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProfilePhoto(null);
                            setProfilePhotoPreview(null);
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Upload className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex flex-col items-center text-sm text-gray-500">
                          <span>Click to upload a full-length profile photo</span>
                          <span className="text-xs">(JPEG or PNG, clear background, max 5MB)</span>
                        </div>
                        <Input
                          id="profilePhoto"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'profilePhoto')}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('profilePhoto')?.click()}
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={loading || uploadingFiles}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login">
                    <Button
                      type="button"
                      variant="outline"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button
                      type="button"
                      variant="outline"
                    >
                      <Home size={16} className="mr-2" />
                      Home
                    </Button>
                  </Link>
                </div>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || uploadingFiles}
                >
                  {loading || uploadingFiles ? "Processing..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
