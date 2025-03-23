
import { CertificateData } from "../types/certificate";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { setupPdfStyles, addPdfHeader, addCertificateTitle, addRecipientInfo, addExperienceSection, addSkillsSection, addShiftsTable, addFooterInformation, addVerificationQRCode, addSignatureAndWatermark } from "./pdfGeneratorUtils";

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
  
  // Setup document styles
  setupPdfStyles(doc);
  
  // Add structured components to the PDF
  addPdfHeader(doc, data.issueDate);
  addCertificateTitle(doc);
  addRecipientInfo(doc, data.promoterName, data.totalHours, data.positionTitle, data.referenceNumber);
  
  // Get final Y position after table so we can position remaining elements
  const contentEndY = addExperienceSection(doc, data.promotionNames);
  const skillsEndY = addSkillsSection(doc, data.skillsGained, contentEndY);
  const tableEndY = await addShiftsTable(doc, data.shifts, skillsEndY);
  
  // Add footer, verification QR code, and signature elements
  addFooterInformation(doc, data.issueDate, data.managerContact, data.performanceRating, tableEndY);
  await addVerificationQRCode(doc, data.referenceNumber, tableEndY);
  addSignatureAndWatermark(doc, tableEndY);
  
  // Return as blob with improved quality
  return doc.output('blob');
};
