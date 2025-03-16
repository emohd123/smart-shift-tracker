
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertificateData } from "./hooks/useCertificateGeneration";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Award, Calendar, Briefcase, Trophy, User } from "lucide-react";

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
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Award className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Certificate of Work Completion
            </h1>
            <p className="text-muted-foreground">Reference: {certificateData.referenceNumber}</p>
          </div>
          
          <div className="border-t border-b py-6 my-6">
            <p className="text-center text-muted-foreground">This certifies that</p>
            <h2 className="text-2xl font-bold text-center my-3 flex items-center justify-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {certificateData.promoterName}
            </h2>
            <p className="text-center text-muted-foreground">has successfully completed</p>
            <p className="text-4xl font-bold text-center my-3 text-primary flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6" />
              {certificateData.totalHours} Hours
            </p>
            <p className="text-center text-muted-foreground">of work as a</p>
            <p className="text-xl font-semibold text-center my-3 flex items-center justify-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {certificateData.positionTitle}
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Promotion Activities:
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
              Skills Gained:
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
          
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Shift Summary:
            </h3>
            <div className="text-sm border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {certificateData.shifts.map((shift, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-secondary/30' : ''}>
                      <td className="px-4 py-2">{shift.date}</td>
                      <td className="px-4 py-2">{shift.title}</td>
                      <td className="px-4 py-2">{shift.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-sm text-muted-foreground">Issue Date:</p>
              <p className="font-medium">{certificateData.issueDate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Verification Contact:</p>
              <p className="font-medium">{certificateData.managerContact}</p>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-6">
            <p className="text-center text-sm text-muted-foreground">
              This certificate is issued by SmartShift and certifies that the promoter has completed the work as stated.
            </p>
            <div className="flex justify-center mt-2">
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
