import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { WorkExperienceData } from '../types/certificate';
import QRCode from 'qrcode';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateEnhancedWorkExperiencePDF = async (data: WorkExperienceData): Promise<Blob> => {
  const doc = new jsPDF();
  let yPosition = 0;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const cardWidth = pageWidth - (margin * 2);
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;
  
  // Official color palette
  const navy: [number, number, number] = [13, 33, 55];
  const gold: [number, number, number] = [184, 134, 11];
  const darkText: [number, number, number] = [26, 26, 46];
  const mutedText: [number, number, number] = [74, 85, 104];
  const lineColor: [number, number, number] = [201, 209, 220];
  
  // Generate QR code
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  } catch {
    qrDataUrl = null;
  }
  
  // Use company info or defaults
  const companyName = data.companyInfo?.name || 'Smart Shift Tracker';

  // ===== SUBTLE DOCUMENT FRAME (no ornaments) =====
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.25);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28, 'S');

  // ===== HEADER BANNER =====
  yPosition = 18;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, yPosition, cardWidth, 28, 'F');
  
  // Gold accent line at bottom of header
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(margin, yPosition + 28, cardWidth, 1.5, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF EMPLOYMENT', pageWidth / 2, yPosition + 13, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Documentation of Professional Work Experience', pageWidth / 2, yPosition + 22, { align: 'center' });

  // Official seal (right side of header)
  const sealX = pageWidth - margin - 18;
  const sealY = yPosition + 14;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.circle(sealX, sealY, 8, 'S');
  doc.setLineWidth(0.4);
  doc.circle(sealX, sealY, 6, 'S');
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFIED', sealX, sealY - 1, { align: 'center' });
  doc.setFontSize(7);
  doc.text('✦', sealX, sealY + 3, { align: 'center' });

  yPosition = 52;

  // ===== DOCUMENT METADATA BAR =====
  doc.setFillColor(247, 249, 252);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPosition, cardWidth, 12, 'FD');
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  
  const issueDate = new Date(data.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const metaItems = [
    `DOCUMENT ID: ${data.referenceNumber}`,
    `ISSUE DATE: ${issueDate}`,
    `REF: ${data.referenceNumber.slice(-6)}`
  ];
  
  const metaWidth = cardWidth / 3;
  metaItems.forEach((item, i) => {
    doc.text(item, margin + (metaWidth * i) + metaWidth / 2, yPosition + 7.5, { align: 'center' });
  });

  yPosition = 70;

  // ===== CERTIFICATION STATEMENT =====
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statement = `This is to certify that ${data.promoterName} has successfully completed the work assignments detailed herein, demonstrating professional competence and dedication.`;
  const splitStatement = doc.splitTextToSize(statement, cardWidth - 20);
  doc.text(splitStatement, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += splitStatement.length * 5 + 8;

  // ===== IDENTITY CARD =====
  doc.setFillColor(255, 254, 248);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, cardWidth, 30, 'FD');
  
  // Left border accent
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, yPosition, 3, 30, 'F');
  
  // Name
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text(data.promoterName, margin + 10, yPosition + 12);
  
  // Badges
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin + 10, yPosition + 16, 22, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE', margin + 21, yPosition + 19.5, { align: 'center' });
  
  doc.setFillColor(13, 92, 47);
  doc.rect(margin + 35, yPosition + 16, 18, 5, 'F');
  doc.text('✓ VERIFIED', margin + 44, yPosition + 19.5, { align: 'center' });
  
  // Period info
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employment Period: ${data.workPeriod.startDate} to ${data.workPeriod.endDate}`, margin + 10, yPosition + 27);
  
  // Total hours badge (right)
  const hoursBadgeX = pageWidth - margin - 35;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(hoursBadgeX, yPosition + 5, 30, 20, 'F');
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1);
  doc.rect(hoursBadgeX, yPosition + 5, 30, 20, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(data.totalHours)}`, hoursBadgeX + 15, yPosition + 15, { align: 'center' });
  doc.setFontSize(6);
  doc.text('TOTAL HOURS', hoursBadgeX + 15, yPosition + 21, { align: 'center' });

  yPosition += 38;

  // ===== SECTION HEADER - EMPLOYMENT RECORD =====
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, margin + 60, yPosition);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYMENT RECORD', margin, yPosition - 2);
  
  yPosition += 8;

  // ===== COMPANY INFO =====
  doc.setFillColor(247, 249, 252);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPosition, cardWidth, 18, 'FD');
  
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin + 6, yPosition + 8);
  
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const companyDetails: string[] = [];
  if (data.companyInfo?.registration_id) companyDetails.push(`Reg: ${data.companyInfo.registration_id}`);
  if (data.companyInfo?.phone) companyDetails.push(`Tel: ${data.companyInfo.phone}`);
  if (data.companyInfo?.email) companyDetails.push(data.companyInfo.email);
  doc.text(companyDetails.join('  |  '), margin + 6, yPosition + 14);

  yPosition += 22;

  // ===== WORK HISTORY TABLE =====
  const tableData = data.shifts.map(shift => [
    shift.date,
    shift.title,
    shift.location || 'On-site',
    `${shift.hours.toFixed(1)}h`
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Date', 'Position / Event', 'Location', 'Hours']],
    body: tableData,
    tableWidth: cardWidth,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 3,
      textColor: darkText
    },
    alternateRowStyles: {
      fillColor: [250, 251, 252]
    },
    styles: {
      lineColor: lineColor,
      lineWidth: 0.3
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // ===== SUMMARY STATISTICS =====
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.rect(margin, yPosition, cardWidth, 16, 'FD');
  
  const stats = [
    { label: 'Total Shifts', value: data.totalShifts.toString() },
    { label: 'Total Hours', value: `${data.totalHours}h` },
    { label: 'Avg Hours/Shift', value: `${data.timeLogs.averageHoursPerShift}h` },
    { label: 'Performance', value: `${data.performanceRating}/5` }
  ];
  
  const statWidth = cardWidth / 4;
  stats.forEach((stat, i) => {
    const x = margin + (statWidth * i) + statWidth / 2;
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label.toUpperCase(), x, yPosition + 5, { align: 'center' });
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x, yPosition + 12, { align: 'center' });
  });

  yPosition += 22;

  // ===== BOTTOM SECTION - SIGNATURE & VERIFICATION =====
  // Keep it near the bottom for short certificates (cleaner / more official).
  const bottomY = Math.max(yPosition, 250);
  
  // Signature box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(margin, bottomY, 55, 22, 'FD');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED SIGNATURE', margin + 27.5, bottomY + 4, { align: 'center' });
  doc.setDrawColor(darkText[0], darkText[1], darkText[2]);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, bottomY + 18, margin + 50, bottomY + 18);
  
  // Date box
  doc.setFillColor(247, 249, 252);
  doc.rect(margin + 58, bottomY, 35, 22, 'FD');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.text('DATE OF ISSUE', margin + 75.5, bottomY + 4, { align: 'center' });
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(issueDate, margin + 75.5, bottomY + 14, { align: 'center' });
  
  // Verification box
  const verifyBoxX = margin + 96;
  const verifyBoxW = cardWidth - 96;
  doc.setFillColor(240, 244, 248);
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.8);
  doc.rect(verifyBoxX, bottomY, verifyBoxW, 22, 'FD');
  
  // Checkmark circle
  doc.setFillColor(13, 92, 47);
  doc.circle(verifyBoxX + 8, bottomY + 11, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('✓', verifyBoxX + 8, bottomY + 13, { align: 'center' });
  
  // Verification text
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHENTICATED', verifyBoxX + 18, bottomY + 9);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('Digitally verified certificate.', verifyBoxX + 18, bottomY + 14);
  doc.text('Scan QR code to verify online.', verifyBoxX + 18, bottomY + 18);
  
  // QR Code
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 18, bottomY + 2, 16, 16);
    } catch {}
  }

  // ===== FOOTER =====
  const footerY = 280;
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Shift Tracker™ — Workforce Management Platform', margin, footerY + 5);
  doc.text(`Document Ref: ${data.referenceNumber}`, pageWidth - margin, footerY + 5, { align: 'right' });

  return doc.output('blob');
};

const getPerformanceText = (rating: number): string => {
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Excellent';
  if (rating >= 3.5) return 'Very Good';
  if (rating >= 3.0) return 'Good';
  if (rating >= 2.5) return 'Satisfactory';
  return 'Needs Improvement';
};
