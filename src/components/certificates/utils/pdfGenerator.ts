
import { CertificateData } from "../types/certificate";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { 
  setupPdfStyles, 
  addPdfHeader, 
  addCertificateTitle, 
  addRecipientInfo, 
  addExperienceSection, 
  addSkillsSection, 
  addShiftsTable,
  addFooterInformation, 
  addVerificationQRCode, 
  addSignatureAndWatermark 
} from "./pdfGeneratorUtils";

// We need to add this to make TypeScript recognize the autotable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Generates a certificate PDF with optimized performance
 */
export const generateCertificatePDF = async (data: CertificateData): Promise<Blob> => {
  console.log("Starting PDF generation process");
  const startTime = performance.now();
  
  // Create a new PDF document with better quality but lower memory footprint
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true // Enable compression for better performance
  });
  
  // Setup document styles
  setupPdfStyles(doc);
  
  // Add structured components to the PDF
  console.log("Adding PDF components");
  addPdfHeader(doc, data.issueDate);
  addCertificateTitle(doc);
  addRecipientInfo(doc, data.promoterName, data.totalHours, data.positionTitle, data.referenceNumber);
  
  // Get final Y position after table so we can position remaining elements
  const contentEndY = addExperienceSection(doc, data.promotionNames);
  const skillsEndY = addSkillsSection(doc, data.skillsGained, contentEndY);
  
  // Most resource-intensive operation - add shifts table
  console.log("Adding shifts table");
  const tableEndY = await addShiftsTable(doc, data.shifts, skillsEndY);
  
  // Add footer and verification elements
  console.log("Adding footer and verification elements");
  addFooterInformation(doc, data.issueDate, data.managerContact, data.performanceRating, tableEndY);
  
  // Generate and add QR code
  console.log("Generating QR code");
  await addVerificationQRCode(doc, data.referenceNumber, tableEndY);
  
  // Add signature
  addSignatureAndWatermark(doc, tableEndY);
  
  // Generate blob with improved settings
  console.log("Generating final PDF blob");
  const pdfBlob = doc.output('blob');
  
  const endTime = performance.now();
  console.log(`PDF generation completed in ${(endTime - startTime).toFixed(2)}ms`);
  
  return pdfBlob;
};
