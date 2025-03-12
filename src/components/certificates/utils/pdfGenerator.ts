
import { CertificateData } from "../hooks/useCertificateGeneration";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

// We need to add this to make TypeScript recognize the autotable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateCertificatePDF = async (data: CertificateData): Promise<Blob> => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set font styles
  doc.setFont("helvetica");
  
  // Add header with logo placeholder
  doc.setFillColor(64, 64, 255); // Primary color
  doc.rect(10, 10, 190, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("SmartShift", 15, 20);
  doc.setFontSize(12);
  doc.text("Work Certificate", 170, 20);
  
  // Add title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(22);
  doc.text("Certificate of Work Completion", 105, 40, { align: "center" });
  
  // Add reference number
  doc.setFontSize(10);
  doc.text(`Reference: ${data.referenceNumber}`, 105, 48, { align: "center" });
  
  // Add main certificate content
  doc.setFontSize(12);
  doc.text("This certifies that", 105, 60, { align: "center" });
  
  // Promoter name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.promoterName, 105, 70, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("has successfully completed", 105, 80, { align: "center" });
  
  // Total hours
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.totalHours} Hours`, 105, 90, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("of work as a", 105, 100, { align: "center" });
  
  // Position title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.positionTitle, 105, 110, { align: "center" });
  doc.setFont("helvetica", "normal");
  
  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(30, 120, 180, 120);
  
  // Skills section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Skills Gained:", 20, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const skillsText = data.skillsGained.join(", ");
  doc.text(skillsText, 20, 138);
  
  // Shifts table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Shift Summary:", 20, 150);
  
  // Create table data
  const tableColumn = ["Date", "Title", "Hours"];
  const tableRows = data.shifts.map(shift => [
    shift.date,
    shift.title,
    shift.hours.toString()
  ]);
  
  // Add table
  doc.autoTable({
    startY: 155,
    head: [tableColumn],
    body: tableRows,
    headStyles: {
      fillColor: [220, 220, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    theme: 'grid'
  });
  
  // Add footer information
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Issue Date: ${data.issueDate}`, 20, finalY);
  doc.text(`Manager Contact: ${data.managerContact}`, 20, finalY + 7);
  
  // Performance rating
  doc.text(`Performance Rating: ${'★'.repeat(data.performanceRating)}`, 20, finalY + 14);
  
  // Signature line
  doc.line(120, finalY + 20, 180, finalY + 20);
  doc.setFontSize(10);
  doc.text("Authorized Signature", 150, finalY + 25, { align: "center" });
  
  // Company attestation
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This certificate verifies that the individual named above has completed the specified work hours and demonstrated proficiency in the skills listed.",
    105, 
    finalY + 35, 
    { align: "center", maxWidth: 150 }
  );
  
  // Add verification instructions
  doc.text(
    "To verify this certificate, please contact the manager at the provided contact number or scan the QR code.",
    105, 
    finalY + 45, 
    { align: "center", maxWidth: 150 }
  );
  
  // QR code placeholder (in a real implementation, generate and add a QR code)
  doc.rect(85, finalY + 50, 40, 40);
  doc.text("QR Code", 105, finalY + 75, { align: "center" });
  
  // Return as blob
  return doc.output('blob');
};
