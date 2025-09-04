
import { jsPDF } from "jspdf";

/**
 * Adds footer information including issue date, manager contact, and performance rating
 */
export const addFooterInformation = (
  doc: jsPDF, 
  issueDate: string, 
  managerContact: string, 
  performanceRating: number,
  startY: number
): void => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Issue Date: ${issueDate}`, 40, startY + 10);
  doc.text(`Manager Contact: ${managerContact}`, 40, startY + 16);
  
  // Performance rating with stars
  doc.text("Performance Rating:", 40, startY + 22);
  doc.setTextColor(255, 180, 0);
  const starCharacter = "★";
  let starRating = "";
  for (let i = 0; i < performanceRating; i++) {
    starRating += starCharacter;
  }
  doc.text(starRating, 80, startY + 22);
};

/**
 * Adds digital signature and watermark to the PDF
 */
export const addSignatureAndWatermark = (doc: jsPDF, startY: number): void => {
  // Add digital signature
  doc.setDrawColor(100, 100, 100);
  doc.line(160, startY + 25, 220, startY + 25);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Digital Signature", 190, startY + 30, { align: "center" });
  
  // Add signature image placeholder (in a real scenario, this would be the actual signature)
  doc.setFontSize(7);
  doc.text("John Doe, Operations Manager", 190, startY + 20, { align: "center" });
  
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
    startY + 45, 
    { align: "center" }
  );
  doc.text(
    "the work assignments as stated. This document serves as proof of professional experience.",
    148.5, 
    startY + 50, 
    { align: "center" }
  );
};
