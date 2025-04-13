
import { jsPDF } from "jspdf";

/**
 * Sets up the basic styles for the PDF document
 */
export const setupPdfStyles = (doc: jsPDF): void => {
  doc.setFont("helvetica", "bold");
};

/**
 * Adds the header section to the PDF
 */
export const addPdfHeader = (doc: jsPDF, issueDate: string): void => {
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
  doc.text(`Issued: ${issueDate}`, 250, 10);
};

/**
 * Adds the certificate title section
 */
export const addCertificateTitle = (doc: jsPDF): void => {
  // Add title with decoration
  doc.setTextColor(30, 30, 80);
  doc.setFontSize(24);
  doc.text("Certificate of Professional Experience", 148.5, 40, { align: "center" });
  
  // Add decorative line under title
  doc.setDrawColor(80, 80, 255);
  doc.setLineWidth(0.5);
  doc.line(74, 45, 223, 45);
};
