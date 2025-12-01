import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building2, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import QRCode from "react-qr-code";

export interface CompanyWorkEntry {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    website?: string;
    email?: string;
    phone?: string;
  };
  shifts: {
    id: string;
    title: string;
    dateFrom: string;
    dateTo: string;
    timeFrom: string;
    timeTo: string;
    totalHours: number;
    location?: string;
    approvedAt: string;
  }[];
  totalHours: number;
}

import { MultiCompanyCertificate } from "../types/certificate";

interface MultiCompanyCertificatePreviewProps {
  data: MultiCompanyCertificate;
}

export default function MultiCompanyCertificatePreview({ data }: MultiCompanyCertificatePreviewProps) {
  const verificationUrl = `${window.location.origin}/verify-certificate?ref=${data.referenceNumber}`;

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
        <div className="text-center pb-4 border-b">
          <h2 className="text-xl font-semibold">{data.promoterName}</h2>
          <p className="text-sm text-muted-foreground">Promoter</p>
          <p className="text-xs text-muted-foreground mt-1">
            Issue Date: {format(new Date(data.issueDate), 'MMMM dd, yyyy')}
          </p>
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
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{companyEntry.company.name}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    {companyEntry.company.website && (
                      <p>Website: {companyEntry.company.website}</p>
                    )}
                    {companyEntry.company.email && (
                      <p>Email: {companyEntry.company.email}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{companyEntry.totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
              </div>

              {/* Shifts List */}
              <div className="space-y-3">
                {companyEntry.shifts.map((shift, shiftIdx) => (
                  <div key={shiftIdx} className="bg-background rounded-md p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{shift.title}</h4>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(shift.dateFrom), 'MMM dd')} - {format(new Date(shift.dateTo), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{shift.timeFrom} - {shift.timeTo}</span>
                          </div>
                          {shift.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{shift.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{shift.totalHours}h</p>
                        <Badge variant="outline" className="text-xs mt-1 bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Approved
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="border-t pt-4 flex items-center justify-between bg-primary/5 p-4 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Grand Total Hours</p>
            <p className="text-3xl font-bold text-primary">{data.grandTotalHours} hours</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {data.companies.length} {data.companies.length === 1 ? 'Company' : 'Companies'}
            </p>
          </div>
          <div className="text-center">
            <QRCode value={verificationUrl} size={80} />
            <p className="text-xs text-muted-foreground mt-2">Scan to verify</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Reference Number: <span className="font-mono font-semibold">{data.referenceNumber}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Verify at: {window.location.origin}/verify-certificate
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
