import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building2, Calendar, Clock, MapPin, Mail, Phone, Globe, User, Hash, Briefcase, Tag, FileText } from "lucide-react";
import { format } from "date-fns";
import QRCode from "react-qr-code";
import { MultiCompanyCertificate, CompanyWorkEntry } from "../types/certificate";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Helper to format hours as whole numbers
const formatHours = (hours: number) => Math.round(hours);

// Re-export for backward compatibility
export type { CompanyWorkEntry };

interface MultiCompanyCertificatePreviewProps {
  data: MultiCompanyCertificate;
}

export default function MultiCompanyCertificatePreview({ data }: MultiCompanyCertificatePreviewProps) {
  const isPreview = data.referenceNumber === 'PREVIEW';
  const verificationUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="space-y-2">
          <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Work Certificate
          </Badge>
          <CardTitle className="text-2xl font-bold">
            WORK EXPERIENCE CERTIFICATE
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This certifies that the following work has been completed and approved
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Promoter Info */}
        <div className="bg-secondary/20 rounded-lg p-4 border">
          <div className="flex items-start gap-4">
            {data.promoter?.profile_photo_url && (
              <Avatar className="h-20 w-20 border-2 border-primary/50">
                <AvatarImage src={data.promoter.profile_photo_url} alt={data.promoterName} />
                <AvatarFallback>{data.promoterName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary">{data.promoterName}</h2>
              <p className="text-sm text-muted-foreground">Promoter</p>
              <p className="text-xs text-muted-foreground mt-1">
                Issued on: {format(new Date(data.issueDate), 'MMMM dd, yyyy')}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                {data.promoter?.email && (
                  <p className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {data.promoter.email}
                  </p>
                )}
                {data.promoter?.phone_number && (
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {data.promoter.phone_number}
                  </p>
                )}
                {data.promoter?.nationality && (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {data.promoter.nationality}
                  </p>
                )}
                {data.promoter?.unique_code && (
                  <p className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {data.promoter.unique_code}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="space-y-6">
          {data.companies.map((companyEntry, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-secondary/20">
              {/* Company Header */}
              <div className="flex items-start gap-4 mb-4 pb-4 border-b">
                {companyEntry.company.logo_url && (
                  <img 
                    src={companyEntry.company.logo_url} 
                    alt={companyEntry.company.name}
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg">{companyEntry.company.name}</h3>
                  </div>
                  {(companyEntry.company as any).industry && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {(companyEntry.company as any).industry}
                    </p>
                  )}
                  {((companyEntry.company as any).city || (companyEntry.company as any).country) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {[(companyEntry.company as any).city, (companyEntry.company as any).country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                    {companyEntry.company.website && (
                      <p className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> <a href={companyEntry.company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyEntry.company.website}</a>
                      </p>
                    )}
                    {companyEntry.company.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {companyEntry.company.email}
                      </p>
                    )}
                    {companyEntry.company.phone_number && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {companyEntry.company.phone_number}
                      </p>
                    )}
                    {(companyEntry.company as any).contact_person && (
                      <p className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {(companyEntry.company as any).contact_person}
                      </p>
                    )}
                    {((companyEntry.company as any).cr_number || companyEntry.company.registration_number) && (
                      <p className="flex items-center gap-1 col-span-2">
                        <FileText className="h-3 w-3" /> CR/Reg. No: {(companyEntry.company as any).cr_number || companyEntry.company.registration_number}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {formatHours(companyEntry.totalHours)} Verified Hours Total
                  </Badge>
                </div>
              </div>

              {/* Shifts Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Work Assignments</h4>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Event/Campaign</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Location</th>
                        <th className="text-right p-2 font-medium">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyEntry.shifts.map((shift, shiftIdx) => (
                        <tr key={shiftIdx} className="border-t">
                          <td className="p-2">{shift.title}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(shift.dateFrom), 'MMM dd, yyyy')}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shift.location || 'On-site'}
                            </div>
                          </td>
                          <td className="p-2 text-right font-medium">
                            <div className="flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" />
                              {formatHours(shift.totalHours)}h
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <p className="text-sm text-muted-foreground">Total Work Experience</p>
            <p className="text-2xl font-bold text-primary">{formatHours(data.grandTotalHours)} Hours</p>
            <p className="text-xs text-muted-foreground">
              Across {data.companies.length} organization{data.companies.length > 1 ? 's' : ''}
            </p>
          </div>
          
          {!isPreview && (
            <div className="text-center">
              <div className="bg-white p-2 rounded border">
                <QRCode value={verificationUrl} size={80} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Scan to verify</p>
            </div>
          )}
        </div>

        {/* Reference */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <p>Certificate Reference: {isPreview ? 'PREVIEW-ONLY' : data.referenceNumber}</p>
          <p className="mt-1">
            This certificate was generated digitally by Smart Shift Tracker.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
