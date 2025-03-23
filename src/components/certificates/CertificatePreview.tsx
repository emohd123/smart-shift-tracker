
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertificateData } from "./hooks/useCertificateGeneration";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Award, Calendar, Briefcase, Trophy, User, CheckCircle, MapPin, Clock, Shield } from "lucide-react";
import QRCode from "react-qr-code";

interface CertificatePreviewProps {
  certificateData?: CertificateData;
}

export default function CertificatePreview({ certificateData }: CertificatePreviewProps) {
  if (!certificateData) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-primary/20 shadow-md print:shadow-none overflow-hidden">
        <CardContent className="p-8 space-y-6 relative">
          {/* Watermark for authenticity */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-20deg] scale-150">
            <Shield className="w-96 h-96" />
          </div>
          
          <div className="text-center space-y-3 relative">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Award className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Official Certificate of Work Completion
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Reference: {certificateData.referenceNumber}</span>
              <Badge variant="outline" className="flex items-center gap-1 border-green-500/50">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Verified
              </Badge>
            </div>
          </div>
          
          <div className="border-t border-b py-6 my-6 bg-gradient-to-r from-primary/5 to-transparent">
            <p className="text-center text-muted-foreground">This certifies that</p>
            <h2 className="text-2xl font-bold text-center my-3 flex items-center justify-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {certificateData.promoterName}
            </h2>
            <p className="text-center text-muted-foreground">has successfully completed</p>
            <p className="text-4xl font-bold text-center my-3 text-primary flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              {certificateData.totalHours} Hours
            </p>
            <p className="text-center text-muted-foreground">of work as a</p>
            <p className="text-xl font-semibold text-center my-3 flex items-center justify-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {certificateData.positionTitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Professional Experience:
              </h3>
              <div className="flex flex-wrap gap-2">
                {certificateData.promotionNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Professional Skills Demonstrated:
              </h3>
              <div className="flex flex-wrap gap-2">
                {certificateData.skillsGained.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className={cn(
                      "px-3 py-1 text-sm",
                      "hover:bg-primary/10 transition-colors"
                    )}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Work Record Summary:
            </h3>
            <div className="text-sm border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Assignment</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {certificateData.shifts.map((shift, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-secondary/30' : ''}>
                        <td className="px-4 py-2">{shift.date}</td>
                        <td className="px-4 py-2">{shift.title}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {shift.location || "Various Locations"}
                          </div>
                        </td>
                        <td className="px-4 py-2">{shift.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col md:flex-row md:justify-between md:items-end">
            <div>
              <p className="text-sm text-muted-foreground">Issue Date:</p>
              <p className="font-medium">{certificateData.issueDate}</p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <p className="text-sm text-muted-foreground">Verification Contact:</p>
              <p className="font-medium">{certificateData.managerContact}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-secondary/30 to-secondary/10 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium">Certificate Verification</p>
                <p className="text-sm text-muted-foreground">
                  This certificate can be verified online at:
                </p>
                <p className="text-sm font-medium">
                  verify-certificate.smartshift.com/{certificateData.referenceNumber}
                </p>
              </div>
              <div className="border border-primary/30 rounded p-2 bg-white">
                <QRCode
                  size={96}
                  value={`https://verify-certificate.smartshift.com/${certificateData.referenceNumber}`}
                  level="H"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="flex items-center text-primary">
                  <span className="mr-2">Performance Rating:</span>
                  {Array(certificateData.performanceRating).fill('★').map((star, i) => (
                    <span key={i} className="text-primary text-lg">★</span>
                  ))}
                  {Array(5 - certificateData.performanceRating).fill('★').map((star, i) => (
                    <span key={i} className="text-muted text-lg">★</span>
                  ))}
                </div>
              </div>
              <div className="w-32 border-b border-black mt-6">
                <p className="text-center text-xs mt-2">Authorized Signature</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              This official certificate is issued by SmartShift and validates that the individual has completed the work assignments 
              as stated. This document serves as proof of professional experience and can be presented to potential employers.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
