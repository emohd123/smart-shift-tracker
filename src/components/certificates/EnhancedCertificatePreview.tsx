import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star, Users, Briefcase, Award, Globe, Mail, Phone } from "lucide-react";
import { CertificateData, WorkExperienceData } from "./types/certificate";

type EnhancedCertificatePreviewProps = {
  certificateData: CertificateData | WorkExperienceData | undefined;
  template: string;
};

export function EnhancedCertificatePreview({ certificateData, template }: EnhancedCertificatePreviewProps) {
  if (!certificateData) return null;

  const data = certificateData as WorkExperienceData;
  
  const templateStyles = {
    professional: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    modern: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    classic: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
    minimal: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
  };

  const headerStyles = {
    professional: "bg-gradient-to-r from-blue-600 to-blue-800 text-white",
    modern: "bg-gradient-to-r from-purple-600 to-purple-800 text-white",
    classic: "bg-gradient-to-r from-green-600 to-green-800 text-white",
    minimal: "bg-gradient-to-r from-gray-700 to-gray-900 text-white"
  };
  
  return (
    <Card className={`w-full max-w-4xl mx-auto border-2 ${templateStyles[template as keyof typeof templateStyles]} shadow-lg`}>
      {/* Enhanced Header with Company Branding */}
      <CardHeader className={`text-center ${headerStyles[template as keyof typeof headerStyles]} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4">
            <Award className="h-24 w-24" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Award className="h-16 w-16" />
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Award className="h-8 w-8" />
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold mb-2">
            COMPREHENSIVE WORK EXPERIENCE CERTIFICATE
          </CardTitle>
          <CardDescription className="text-xl font-medium text-white/90">
            Official Employment Verification & Skills Documentation
          </CardDescription>
          
          <div className="flex justify-center mt-4">
            <Badge variant="secondary" className="bg-white text-primary px-4 py-1 text-sm">
              Reference: {data.referenceNumber}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        {/* Enhanced Employee Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm bg-white/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold text-primary">Full Name:</span>
                <p className="text-lg font-medium">{data.promoterName}</p>
              </div>
              <div>
                <span className="font-semibold text-primary">Certificate Issue Date:</span>
                <p>{data.issueDate}</p>
              </div>
              <div>
                <span className="font-semibold text-primary">Employment Period:</span>
                <p className="font-medium">{data.workPeriod.startDate} to {data.workPeriod.endDate}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Work Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-primary">Total Hours:</span>
                  <p className="text-2xl font-bold text-primary">{data.totalHours}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">Total Shifts:</span>
                  <p className="text-2xl font-bold text-primary">{data.totalShifts}</p>
                </div>
              </div>
              <div>
                <span className="font-semibold text-primary">Average Hours per Shift:</span>
                <p className="font-medium">{data.timeLogs.averageHoursPerShift} hours</p>
              </div>
              <div>
                <span className="font-semibold text-primary">Performance Rating:</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i < data.performanceRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">({data.performanceRating}/5)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Positions and Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm bg-white/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Positions & Roles Held
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.roles.map((role, index) => (
                  <Badge key={index} variant="default" className="text-sm px-3 py-1">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Work Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.locations.map((location, index) => (
                  <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                    {location}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Work History Table */}
        <Card className="border-none shadow-sm bg-white/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Detailed Work History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-3 px-2 font-semibold text-primary">Date</th>
                    <th className="text-left py-3 px-2 font-semibold text-primary">Position</th>
                    <th className="text-left py-3 px-2 font-semibold text-primary">Location</th>
                    <th className="text-right py-3 px-2 font-semibold text-primary">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shifts.map((shift, index) => (
                    <tr key={index} className={`border-b border-border ${index % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-2 px-2 text-sm">{shift.date}</td>
                      <td className="py-2 px-2 text-sm font-medium">{shift.title}</td>
                      <td className="py-2 px-2 text-sm">{shift.location || 'Multiple Locations'}</td>
                      <td className="py-2 px-2 text-sm text-right font-medium">{shift.hours.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Company Information & Verification */}
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Issuing Authority
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Company:</strong> Professional Certification Authority</p>
                  <p className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <strong>Website:</strong> <span className="text-primary">https://yourcompany.com</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <strong>Email:</strong> certificates@yourcompany.com
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <strong>Contact:</strong> {data.managerContact}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Digital Verification
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-primary">This certificate is digitally verified and authenticated.</p>
                  <p>Verification can be performed online using the reference number above.</p>
                  <p className="font-medium">Digital Signature: ✓ Verified</p>
                  <p className="text-xs text-muted-foreground mt-3 p-2 bg-white/50 rounded">
                    This document is an official work experience certificate generated by our certified system. 
                    All information has been verified and is accurate as of the issue date.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Digital Stamp Placeholder */}
        <div className="flex justify-end">
          <div className="text-center opacity-80">
            <div className="w-32 h-32 border-2 border-primary rounded-full flex items-center justify-center bg-primary/10">
              <div className="text-center">
                <Award className="h-8 w-8 mx-auto text-primary mb-1" />
                <p className="text-xs font-bold text-primary">OFFICIAL</p>
                <p className="text-xs text-primary">SEAL</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Digital Signature Applied</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}