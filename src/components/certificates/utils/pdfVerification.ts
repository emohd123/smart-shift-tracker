
import { jsPDF } from "jspdf";
import QRCode from 'qrcode';

/**
 * Adds the verification QR code to the PDF
 */
export const addVerificationQRCode = async (
  doc: jsPDF, 
  referenceNumber: string,
  startY: number
): Promise<void> => {
  // Generate QR Code with error handling
  const verificationUrl = `https://verify-certificate.smartshift.com/${referenceNumber}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 120,
      margin: 1
    });
    doc.addImage(qrCodeDataUrl, 'PNG', 230, startY - 10, 40, 40);
    
    // Add QR code label
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Scan to verify", 250, startY + 35, { align: "center" });
  } catch (err) {
    console.error("QR code generation failed:", err);
    // Fall back to a placeholder
    doc.rect(230, startY - 10, 40, 40);
    doc.setFontSize(8);
    doc.text("QR Code Placeholder", 250, startY + 10, { align: "center" });
  }
};
