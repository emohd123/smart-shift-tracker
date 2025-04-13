
import { jsPDF } from "jspdf";
import QRCode from 'qrcode';

// Cache for QR codes to avoid regenerating the same codes
const qrCodeCache = new Map<string, string>();

/**
 * Adds the verification QR code to the PDF with performance optimizations
 */
export const addVerificationQRCode = async (
  doc: jsPDF, 
  referenceNumber: string,
  startY: number
): Promise<void> => {
  // Generate QR Code with error handling and caching
  const verificationUrl = `https://verify-certificate.smartshift.com/${referenceNumber}`;
  
  try {
    // Check if we have this QR code cached
    let qrCodeDataUrl = qrCodeCache.get(referenceNumber);
    
    if (!qrCodeDataUrl) {
      // If not in cache, generate with optimized settings
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M', // Use 'M' instead of 'H' for faster generation
        width: 120,
        margin: 1,
        rendererOpts: {
          quality: 0.8 // Lower quality for faster generation
        }
      });
      
      // Store in cache for future use
      qrCodeCache.set(referenceNumber, qrCodeDataUrl);
    }
    
    // Add the QR code to the PDF
    doc.addImage(qrCodeDataUrl, 'PNG', 230, startY - 10, 40, 40);
    
    // Add QR code label
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Scan to verify", 250, startY + 35, { align: "center" });
  } catch (err) {
    console.error("QR code generation failed:", err);
    // Fall back to a placeholder with minimal processing
    doc.setDrawColor(100, 100, 100);
    doc.rect(230, startY - 10, 40, 40);
    doc.setFontSize(8);
    doc.text("QR Code Placeholder", 250, startY + 10, { align: "center" });
  }
};

// Function to clear QR code cache if needed
export const clearQRCodeCache = (): void => {
  qrCodeCache.clear();
};
