
import { jsPDF } from "jspdf";

/**
 * Adds recipient information to the PDF
 */
export const addRecipientInfo = (
  doc: jsPDF, 
  promoterName: string, 
  totalHours: number, 
  positionTitle: string,
  referenceNumber: string
): void => {
  // Add certificate reference and verification
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Reference: ${referenceNumber}`, 148.5, 52, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Verify this certificate at: verify-certificate.smartshift.com/${referenceNumber}`, 148.5, 58, { align: "center" });
  
  // Add main certificate content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("This certifies that", 148.5, 70, { align: "center" });
  
  // Promoter name with decorative styling
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 100);
  doc.text(promoterName, 148.5, 80, { align: "center" });
  
  // Add underline for the name
  const nameWidth = doc.getTextWidth(promoterName);
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
  doc.text(`${totalHours} Hours`, 148.5, 103, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("of professional work as a", 148.5, 113, { align: "center" });
  
  // Position title with styling
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(positionTitle, 148.5, 123, { align: "center" });
  doc.setFont("helvetica", "normal");
  
  // Add decorative border around the main content
  doc.setDrawColor(200, 200, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(30, 60, 237, 80, 3, 3, 'S');
};
