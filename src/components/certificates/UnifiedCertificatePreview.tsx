import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star, Users, Briefcase } from "lucide-react";
import { CertificateData, WorkExperienceData, CertificateType } from "./types/certificate";

type UnifiedCertificatePreviewProps = {
  certificateData: CertificateData | WorkExperienceData | undefined;
  certificateType: CertificateType;
};

export default function UnifiedCertificatePreview({ certificateData, certificateType }: UnifiedCertificatePreviewProps) {
  if (!certificateData) return null;

  if (certificateType === "work_experience") {
    const data = certificateData as WorkExperienceData;
    
    return (
      <Card className="w-full max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-background to-secondary/20">
        <CardHeader className="text-center bg-primary/5 border-b border-primary/20">
          <CardTitle className="text-xl font-bold text-primary">
            WORK EXPERIENCE CERTIFICATE
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Official Employment Verification Document
          </CardDescription>
          <div className="flex justify-center mt-2">
            <Badge variant="outline" className="border-primary text-primary">
              Reference: {data.referenceNumber}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Employee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Employee Information
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {data.promoterName}</p>
                <p><strong>Issue Date:</strong> {data.issueDate}</p>
                <p><strong>Work Period:</strong> {data.workPeriod.startDate} to {data.workPeriod.endDate}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Work Summary
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Total Hours:</strong> {data.totalHours} hours</p>
                <p><strong>Total Shifts:</strong> {data.totalShifts} shifts</p>
                <p><strong>Avg Hours/Shift:</strong> {data.timeLogs.averageHoursPerShift} hours</p>
                <p className="flex items-center gap-1">
                  <strong>Performance:</strong> 
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < data.performanceRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="ml-1">({data.performanceRating}/5)</span>
                  </div>
                </p>
              </div>
            </div>
          </div>

          {/* Positions and Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Positions Held
              </h3>
              <div className="flex flex-wrap gap-1">
                {data.roles.map((role, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Work Locations
              </h3>
              <div className="flex flex-wrap gap-1">
                {data.locations.map((location, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Work History */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Recent Work History (Last 5 shifts)
            </h3>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-2 text-xs font-medium mb-2 pb-2 border-b border-border">
                <div>Date</div>
                <div>Position</div>
                <div>Location</div>
                <div className="text-right">Hours</div>
              </div>
              {data.shifts.slice(-5).map((shift, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 text-xs py-1">
                  <div>{shift.date}</div>
                  <div className="truncate">{shift.title}</div>
                  <div className="truncate">{shift.location || 'N/A'}</div>
                  <div className="text-right font-medium">{shift.hours.toFixed(1)}h</div>
                </div>
              ))}
              {data.shifts.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border mt-2">
                  ... and {data.shifts.length - 5} more shifts
                </div>
              )}
            </div>
          </div>

          {/* Verification */}
          <div className="text-center text-xs text-muted-foreground bg-primary/5 p-4 rounded-lg">
            <p className="font-medium">Digital Verification Available</p>
            <p>This certificate can be verified using the reference number above.</p>
            <p>Contact: {data.managerContact}</p>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    const data = certificateData as CertificateData;
    
    return (
      <Card className="w-full max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-background to-secondary/20">
        <CardHeader className="text-center bg-primary/5 border-b border-primary/20">
          <CardTitle className="text-xl font-bold text-primary">
            PROFESSIONAL SKILLS CERTIFICATE
          </CardTitle>
          <CardDescription className="text-base font-medium">
            {data.promoterName}
          </CardDescription>
          <div className="flex justify-center mt-2">
            <Badge variant="outline" className="border-primary text-primary">
              Reference: {data.referenceNumber}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {/* Basic Info */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Total Hours Completed: <span className="text-primary font-bold">{data.totalHours}</span></p>
            <p className="text-sm text-muted-foreground">Position: {data.positionTitle}</p>
            <p className="text-sm text-muted-foreground">Issue Date: {data.issueDate}</p>
          </div>

          {/* Performance Rating */}
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Performance Rating</p>
            <div className="flex justify-center items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < data.performanceRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
              <span className="ml-2 font-bold">({data.performanceRating}/5)</span>
            </div>
          </div>

          {/* Promotions */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Promotions & Events</h3>
            <div className="flex flex-wrap gap-1">
              {data.promotionNames.map((promotion, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {promotion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Skills Demonstrated</h3>
            <div className="flex flex-wrap gap-1">
              {data.skillsGained.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Verification */}
          <div className="text-center text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
            <p>This certificate is digitally signed and can be verified.</p>
            <p>Contact: {data.managerContact}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}