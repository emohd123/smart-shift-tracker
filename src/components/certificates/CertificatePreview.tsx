
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertificateData } from "./hooks/useCertificateGeneration";

interface CertificatePreviewProps {
  certificateData?: CertificateData;
}

export default function CertificatePreview({ certificateData }: CertificatePreviewProps) {
  if (!certificateData) return null;
  
  return (
    <Card className="border-2 border-primary/20 shadow-md print:shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-2xl font-bold">SS</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center">Certificate of Work Completion</h1>
          <p className="text-muted-foreground">Reference: {certificateData.referenceNumber}</p>
        </div>
        
        <div className="border-t border-b py-4 my-4">
          <p className="text-center">This certifies that</p>
          <h2 className="text-xl font-bold text-center my-2">{certificateData.promoterName}</h2>
          <p className="text-center">has successfully completed</p>
          <p className="text-3xl font-bold text-center my-2 text-primary">
            {certificateData.totalHours} Hours
          </p>
          <p className="text-center">of work as a</p>
          <p className="text-xl font-semibold text-center my-2">{certificateData.positionTitle}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Promotion Activities:</h3>
          <div className="flex flex-wrap gap-2">
            {certificateData.promotionNames.map((name, index) => (
              <Badge key={index} variant="secondary">{name}</Badge>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Skills Gained:</h3>
          <div className="flex flex-wrap gap-2">
            {certificateData.skillsGained.map((skill, index) => (
              <Badge key={index} variant="outline">{skill}</Badge>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Shift Summary:</h3>
          <div className="text-sm border rounded-md overflow-hidden">
            <table className="min-w-full divide-y">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {certificateData.shifts.map((shift, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-secondary/30' : ''}>
                    <td className="px-3 py-2">{shift.date}</td>
                    <td className="px-3 py-2">{shift.title}</td>
                    <td className="px-3 py-2">{shift.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-end">
          <div>
            <p className="text-sm text-muted-foreground">Issue Date:</p>
            <p>{certificateData.issueDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Verification Contact:</p>
            <p>{certificateData.managerContact}</p>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-4">
          <p className="text-center text-sm text-muted-foreground">
            This certificate is issued by SmartShift and certifies that the promoter has completed the work as stated.
            Performance Rating: {Array(certificateData.performanceRating).fill('★').join('')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
