
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
  // Create a new PDF document with better quality
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });
  
  // Add custom font styling
  doc.setFont("helvetica", "bold");
  
  // Create a header with gradient-like appearance
  doc.setFillColor(64, 64, 255);
  doc.rect(0, 0, 297, 15, 'F');
  doc.setFillColor(80, 80, 255);
  doc.rect(0, 15, 297, 5, 'F');
  
  // Add header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("SmartShift Professional Certificate", 20, 10);
  doc.setFontSize(10);
  doc.text(`Issued: ${data.issueDate}`, 250, 10);
  
  // Add title with decoration
  doc.setTextColor(30, 30, 80);
  doc.setFontSize(24);
  doc.text("Certificate of Professional Experience", 148.5, 40, { align: "center" });
  
  // Add decorative line under title
  doc.setDrawColor(80, 80, 255);
  doc.setLineWidth(0.5);
  doc.line(74, 45, 223, 45);
  
  // Add certificate reference and verification
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Reference: ${data.referenceNumber}`, 148.5, 52, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Verify this certificate at: verify-certificate.smartshift.com/${data.referenceNumber}`, 148.5, 58, { align: "center" });
  
  // Add main certificate content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("This certifies that", 148.5, 70, { align: "center" });
  
  // Promoter name with decorative styling
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 100);
  doc.text(data.promoterName, 148.5, 80, { align: "center" });
  
  // Add underline for the name
  const nameWidth = doc.getTextWidth(data.promoterName);
  doc.setDrawColor(100, 100, 255);
  doc.setLineWidth(0.3);
  doc.line(148.5 - nameWidth/2, 83, 148.5 + nameWidth/2, 83);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("has successfully completed", 148.5, 93, { align: "center" });
  
  // Total hours with emphasis
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text(`${data.totalHours} Hours`, 148.5, 103, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("of professional work as a", 148.5, 113, { align: "center" });
  
  // Position title with styling
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.positionTitle, 148.5, 123, { align: "center" });
  doc.setFont("helvetica", "normal");
  
  // Add decorative border around the main content
  doc.setDrawColor(200, 200, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(30, 60, 237, 80, 3, 3, 'S');
  
  // Professional Experience section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text("Professional Experience:", 40, 150);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const experienceText = data.promotionNames.join(", ");
  doc.text(doc.splitTextToSize(experienceText, 220), 40, 158);
  
  // Skills section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text("Professional Skills Demonstrated:", 40, 175);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const skillsText = data.skillsGained.join(", ");
  doc.text(doc.splitTextToSize(skillsText, 220), 40, 183);
  
  // Shifts table with improved styling
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text("Work Record Summary:", 40, 195);
  
  // Create table data
  const tableColumn = ["Date", "Assignment", "Location", "Hours"];
  const tableRows = data.shifts.map(shift => [
    shift.date,
    shift.title,
    shift.location || "Various Locations",
    shift.hours.toString()
  ]);
  
  // Add table with better styling
  doc.autoTable({
    startY: 200,
    head: [tableColumn],
    body: tableRows,
    headStyles: {
      fillColor: [80, 80, 240],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 255]
    },
    theme: 'grid',
    styles: {
      fontSize: 9
    }
  });
  
  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  
  // Add footer information
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Issue Date: ${data.issueDate}`, 40, finalY + 10);
  doc.text(`Manager Contact: ${data.managerContact}`, 40, finalY + 16);
  
  // Performance rating with stars
  doc.text("Performance Rating:", 40, finalY + 22);
  doc.setTextColor(255, 180, 0);
  const starCharacter = "★";
  let starRating = "";
  for (let i = 0; i < data.performanceRating; i++) {
    starRating += starCharacter;
  }
  doc.text(starRating, 80, finalY + 22);
  
  // Generate QR Code with error handling
  const verificationUrl = `https://verify-certificate.smartshift.com/${data.referenceNumber}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 120,
      margin: 1
    });
    doc.addImage(qrCodeDataUrl, 'PNG', 230, finalY - 10, 40, 40);
    
    // Add QR code label
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Scan to verify", 250, finalY + 35, { align: "center" });
  } catch (err) {
    console.error("QR code generation failed:", err);
    // Fall back to a placeholder
    doc.rect(230, finalY - 10, 40, 40);
    doc.setFontSize(8);
    doc.text("QR Code Placeholder", 250, finalY + 10, { align: "center" });
  }
  
  // Add digital signature
  doc.setDrawColor(100, 100, 100);
  doc.line(160, finalY + 25, 220, finalY + 25);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Digital Signature", 190, finalY + 30, { align: "center" });
  
  // Add signature image placeholder (in a real scenario, this would be the actual signature)
  doc.setFontSize(7);
  doc.text("John Doe, Operations Manager", 190, finalY + 20, { align: "center" });
  
  // Add security notice and watermark
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("This document contains security features. The absence of the QR code or digital signature invalidates this certificate.", 148.5, 205, { align: "center" });
  
  // Company attestation
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "This official certificate is issued by SmartShift and validates that the individual has completed",
    148.5, 
    finalY + 45, 
    { align: "center" }
  );
  doc.text(
    "the work assignments as stated. This document serves as proof of professional experience.",
    148.5, 
    finalY + 50, 
    { align: "center" }
  );
  
  // Return as blob with improved quality
  return doc.output('blob');
};
