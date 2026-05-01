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
  const cream: [number, number, number] = [245, 240, 232];

  // Generate QR code
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  } catch {
    qrDataUrl = null;
  }

  // Use company info or defaults
  const companyName = data.companyInfo?.name || 'Smart Shift Tracker';

  // ===== DOUBLE BORDER FRAME =====
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26, 'S');

  // ===== DECORATIVE HEADER =====
  yPosition = 22;

  // "Certificate" title in gold
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.text('Certificate', pageWidth / 2, yPosition, { align: 'center' });

  // "of Employment" subtitle
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('of Employment', pageWidth / 2, yPosition + 8, { align: 'center' });

  // Gold line under title
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 30, yPosition + 12, pageWidth / 2 + 30, yPosition + 12);

  // Ornaments
  doc.setFontSize(10);
  doc.text('◆  ◆  ◆', pageWidth / 2, yPosition + 17, { align: 'center' });

  yPosition = 52;

  // ===== METADATA BAR =====
  doc.setFillColor(247, 249, 252);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPosition, cardWidth, 10, 'FD');

  // Left border accent in gold
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(margin, yPosition, 2, 10, 'F');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);

  const issueDate = new Date(data.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const metaItems = [
    { label: 'DOCUMENT ID', value: data.referenceNumber },
    { label: 'ISSUE DATE', value: issueDate },
    { label: 'STATUS', value: '✓ Verified' }
  ];

  const metaWidth = cardWidth / 3;
  metaItems.forEach((item, i) => {
    const x = margin + (metaWidth * i) + 5;
    doc.text(item.label, x, yPosition + 4);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, yPosition + 8);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.setFont('helvetica', 'normal');
  });

  yPosition = 68;

  // ===== CERTIFICATION STATEMENT =====
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const statement = `This is to certify that ${data.promoterName} has successfully completed the work assignments detailed herein, demonstrating professional competence and dedication in their role as a ${data.positionTitle}.`;
  const splitStatement = doc.splitTextToSize(statement, cardWidth - 20);
  doc.text(splitStatement, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += splitStatement.length * 4.5 + 6;

  // ===== TWO-COLUMN IDENTITY SECTION =====
  const identityHeight = 32;

  // Identity card background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPosition, cardWidth, identityHeight, 'FD');

  // Left column - Photo area
  const photoX = margin + 5;
  const photoY = yPosition + 4;
  const photoSize = 24;

  // Circular photo frame
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1);
  doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 'S');

  // Photo background
  doc.setFillColor(cream[0], cream[1], cream[2]);
  doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 - 1, 'F');

  // Initials in photo area
  const initials = data.promoterName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(initials, photoX + photoSize / 2, photoY + photoSize / 2 + 3, { align: 'center' });

  // Right of photo - Name and details
  const infoX = photoX + photoSize + 8;
  const infoY = yPosition + 6;

  // Name
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.text(data.promoterName, infoX, infoY);

  // Role badge
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(infoX, infoY + 4, 20, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text(data.positionTitle.toUpperCase(), infoX + 10, infoY + 7.5, { align: 'center' });

  // Verified badge
  doc.setFillColor(13, 92, 47);
  doc.rect(infoX + 23, infoY + 4, 18, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('✓ VERIFIED', infoX + 32, infoY + 7.5, { align: 'center' });

  // Details
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nationality: ${data.promoterNationality || 'Bahraini'}   •   Code: ${data.promoCode || 'N/A'}`, infoX, infoY + 14);
  doc.text(`Phone: ${data.promoterPhone || 'N/A'}   •   Email: ${data.promoterEmail || 'N/A'}`, infoX, infoY + 19);

  // Hours pill (right side)
  const hoursPillX = pageWidth - margin - 30;
  const hoursPillY = yPosition + 6;
  doc.setFillColor(cream[0], cream[1], cream[2]);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(hoursPillX, hoursPillY, 25, 20, 3, 3, 'FD');

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(data.totalHours)}`, hoursPillX + 12.5, hoursPillY + 10, { align: 'center' });
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('TOTAL HOURS', hoursPillX + 12.5, hoursPillY + 16, { align: 'center' });

  yPosition += identityHeight + 6;

  // ===== SECTION HEADER - EMPLOYMENT RECORD =====
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPosition, margin + 70, yPosition);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employment Record', margin, yPosition - 2);

  yPosition += 6;

  // ===== COMPANY CARD =====
  doc.setFillColor(cream[0], cream[1], cream[2]);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPosition, cardWidth, 20, 'FD');

  // Left border accent
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(margin, yPosition, 3, 20, 'F');

  // Company logo placeholder
  const logoX = margin + 8;
  const logoY = yPosition + 4;
  const logoSize = 12;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const companyInitials = companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  doc.text(companyInitials, logoX + logoSize / 2, logoY + logoSize / 2 + 2, { align: 'center' });

  // Company name and details
  const companyTextX = logoX + logoSize + 6;
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, companyTextX, yPosition + 8);

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const companyDetails: string[] = [];
  if (data.companyInfo?.registration_id) companyDetails.push(`Reg: ${data.companyInfo.registration_id}`);
  if (data.companyInfo?.email) companyDetails.push(data.companyInfo.email);
  doc.text(companyDetails.join('   |   '), companyTextX, yPosition + 13);

  // Hours badge (right side)
  const companyHoursX = pageWidth - margin - 20;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(companyHoursX, yPosition + 4, 16, 12, 2, 2, 'FD');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(data.totalHours)}`, companyHoursX + 8, yPosition + 11, { align: 'center' });
  doc.setFontSize(4);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('hrs', companyHoursX + 8, yPosition + 14, { align: 'center' });

  yPosition += 24;

  // ===== WORK HISTORY TABLE =====
  const tableData = data.shifts.map(shift => [
    shift.date,
    shift.title,
    shift.location || 'On-site',
    `${shift.hours.toFixed(1)}h`
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
    body: tableData,
    tableWidth: cardWidth,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'left',
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
      0: { cellWidth: 75 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ===== TOTAL HOURS BOX =====
  doc.setFillColor(cream[0], cream[1], cream[2]);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, cardWidth, 14, 2, 2, 'FD');

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Verified Work Experience', pageWidth / 2, yPosition + 4, { align: 'center' });

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.totalHours} ${data.totalHours === 1 ? 'Hour' : 'Hours'}`, pageWidth / 2, yPosition + 10, { align: 'center' });

  yPosition += 18;

  // ===== BOTTOM SECTION - SIGNATURE & VERIFICATION =====
  const bottomY = Math.min(yPosition, 245);

  // Horizontal line separator
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, bottomY, pageWidth - margin, bottomY);

  // QR Code area (left)
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', margin + 5, bottomY + 5, 20, 20);
    } catch {
      // QR code failed, draw placeholder
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.rect(margin + 5, bottomY + 5, 20, 20, 'S');
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.setFontSize(5);
      doc.text('QR', margin + 15, bottomY + 16, { align: 'center' });
    }
  } else {
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.rect(margin + 5, bottomY + 5, 20, 20, 'S');
  }

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('Scan to Verify', margin + 15, bottomY + 28, { align: 'center' });

  // Official Seal (center)
  const sealX = pageWidth / 2;
  const sealY = bottomY + 15;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1);
  doc.circle(sealX, sealY, 10, 'S');
  doc.setLineWidth(0.5);
  doc.circle(sealX, sealY, 8, 'S');
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL', sealX, sealY - 2, { align: 'center' });
  doc.text('SEAL', sealX, sealY + 2, { align: 'center' });

  // Signature line (center-right)
  const sigX = sealX + 25;
  const sigY = bottomY + 20;
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.5);
  doc.line(sigX, sigY, sigX + 40, sigY);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', sigX + 20, sigY + 4, { align: 'center' });

  // Date area (right)
  const dateX = pageWidth - margin - 25;
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.text('Date of Issue', dateX, bottomY + 10, { align: 'right' });
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(issueDate, dateX, bottomY + 16, { align: 'right' });
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(5);
  doc.setFont('courier', 'normal');
  doc.text(data.referenceNumber, dateX, bottomY + 22, { align: 'right' });

  // ===== FOOTER =====
  const footerY = pageHeight - 18;
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('SmartShift Tracker', margin + 2, footerY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('—', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text(`Document Reference: ${data.referenceNumber}`, pageWidth - margin - 2, footerY + 4, { align: 'right' });

  return doc.output('blob');
};