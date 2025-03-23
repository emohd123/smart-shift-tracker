
import { CertificateData } from "../hooks/useCertificateGeneration";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import QRCode from 'qrcode';

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
  doc.text("Official Work Certificate", 170, 20);
  
  // Add title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(22);
  doc.text("Official Certificate of Work Completion", 105, 40, { align: "center" });
  
  // Add reference and verification
  doc.setFontSize(10);
  doc.text(`Reference: ${data.referenceNumber}`, 105, 48, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Verify at: verify-certificate.smartshift.com/${data.referenceNumber}`, 105, 53, { align: "center" });
  
  // Add main certificate content
  doc.setFontSize(12);
  doc.text("This certifies that", 105, 65, { align: "center" });
  
  // Promoter name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.promoterName, 105, 75, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("has successfully completed", 105, 85, { align: "center" });
  
  // Total hours
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.totalHours} Hours`, 105, 95, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("of work as a", 105, 105, { align: "center" });
  
  // Position title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.positionTitle, 105, 115, { align: "center" });
  doc.setFont("helvetica", "normal");
  
  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(30, 125, 180, 125);
  
  // Professional Experience section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Professional Experience:", 20, 135);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const experienceText = data.promotionNames.join(", ");
  doc.text(experienceText, 20, 143);
  
  // Skills section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Professional Skills Demonstrated:", 20, 153);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const skillsText = data.skillsGained.join(", ");
  doc.text(skillsText, 20, 161);
  
  // Shifts table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Work Record Summary:", 20, 171);
  
  // Create table data
  const tableColumn = ["Date", "Assignment", "Location", "Hours"];
  const tableRows = data.shifts.map(shift => [
    shift.date,
    shift.title,
    shift.location || "Various Locations",
    shift.hours.toString()
  ]);
  
  // Add table
  doc.autoTable({
    startY: 176,
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
  
  // Generate QR Code
  const verificationUrl = `https://verify-certificate.smartshift.com/${data.referenceNumber}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { width: 100 });
    doc.addImage(qrCodeDataUrl, 'PNG', 150, finalY, 40, 40);
  } catch (err) {
    console.error("QR code generation failed:", err);
    // Fall back to a placeholder
    doc.rect(150, finalY, 40, 40);
    doc.setFontSize(8);
    doc.text("QR Code", 170, finalY + 20, { align: "center" });
  }
  
  // Company attestation
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This official certificate is issued by SmartShift and validates that the individual has completed the work assignments as stated.",
    105, 
    finalY + 50, 
    { align: "center", maxWidth: 150 }
  );
  
  // Add verification instructions
  doc.text(
    "This document serves as proof of professional experience and can be presented to potential employers.",
    105, 
    finalY + 60, 
    { align: "center", maxWidth: 150 }
  );
  
  // Signature line
  doc.line(120, finalY + 35, 180, finalY + 35);
  doc.setFontSize(10);
  doc.text("Authorized Signature", 150, finalY + 40, { align: "center" });
  
  // Return as blob
  return doc.output('blob');
};
