import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { WorkExperienceData } from '../types/certificate';
import QRCode from 'qrcode';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper to format text with proper title case
const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const generateEnhancedWorkExperiencePDF = async (data: WorkExperienceData): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;

  // ===== COLOR PALETTE =====
  const navy: [number, number, number] = [26, 26, 46];          // #1a1a2e
  const gold: [number, number, number] = [201, 168, 76];       // #c9a84c
  const darkText: [number, number, number] = [26, 26, 46];     // #1a1a2e
  const mutedText: [number, number, number] = [102, 102, 102]; // #666666
  const cream: [number, number, number] = [245, 240, 232];     // #f5f0e8
  const white: [number, number, number] = [255, 255, 255];

  // Generate QR code
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  } catch {
    qrDataUrl = null;
  }

  // Use company info or defaults
  const companyName = data.companyInfo?.name || 'Smart Shift Tracker';
  const companySubtitle = (data.companyInfo as any)?.subtitle || 'ADVERTISING AND PROMOTION';
  const companyWebsite = data.companyInfo?.website || 'https://cactus.bh/';
  const companyEmail = data.companyInfo?.email || 'ebrahim@cactus.bh';
  const companyReg = data.companyInfo?.registration_id || '69612-1';

  // ===== DOUBLE BORDER FRAME =====
  // Outer navy border
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
  // Inner gold border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  // ===== HEADER =====
  let y = 22;

  // "CERTIFICATE" in gold
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(28);
  doc.setFont('times', 'bold');
  doc.text('CERTIFICATE', pageWidth / 2, y, { align: 'center' });

  // "of Employment" subtitle
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(16);
  doc.setFont('times', 'normal');
  doc.text('of Employment', pageWidth / 2, y + 10, { align: 'center' });

  // Gold line
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 30, y + 16, pageWidth / 2 + 30, y + 16);

  // Diamonds
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(10);
  doc.text('\u25C6  \u25C6  \u25C6', pageWidth / 2, y + 22, { align: 'center' });

  y = 56;

  // ===== TWO-COLUMN LAYOUT =====
  const leftColX = margin;
  const leftColW = contentWidth * 0.40;
  const rightColX = leftColX + leftColW + 8;
  const rightColW = contentWidth * 0.55;

  // --- LEFT COLUMN ---

  // Photo circle
  const photoSize = 40;
  const photoX = leftColX + (leftColW - photoSize) / 2;
  const photoY = y;

  // Gold circle border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.5);
  doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 'S');
  // Cream fill
  doc.setFillColor(cream[0], cream[1], cream[2]);
  doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 - 1.5, 'F');

  // Initials
  const initials = data.promoterName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.text(initials, photoX + photoSize / 2, photoY + photoSize / 2 + 4, { align: 'center' });

  // Name
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.text(data.promoterName, leftColX + leftColW / 2, photoY + photoSize + 8, { align: 'center' });

  // Role
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.positionTitle.toUpperCase(), leftColX + leftColW / 2, photoY + photoSize + 15, { align: 'center' });

  // Info card
  const cardY = photoY + photoSize + 22;
  const cardH = 38;
  doc.setFillColor(white[0], white[1], white[2]);
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftColX + 2, cardY, leftColW - 4, cardH, 3, 3, 'FD');

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const infoItems = [
    { label: 'Nationality:', value: data.promoterNationality || 'Bahraini' },
    { label: 'Code:', value: data.promoCode || 'PROMO-96DVLH' },
    { label: 'Phone:', value: data.promoterPhone || '0097336357377' },
    { label: 'Email:', value: data.promoterEmail || 'emohd123@hotmail.com' },
    { label: 'Issued:', value: new Date(data.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  ];

  let infoY = cardY + 6;
  infoItems.forEach(item => {
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, leftColX + 8, infoY);
    const labelWidth = doc.getTextWidth(item.label);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, leftColX + 8 + labelWidth + 2, infoY);
    infoY += 6.5;
  });

  // --- RIGHT COLUMN ---

  // Company card
  const companyCardY = y;
  const companyCardH = 32;
  doc.setFillColor(white[0], white[1], white[2]);
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(rightColX, companyCardY, rightColW, companyCardH, 3, 3, 'FD');

  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text(companyName, rightColX + 5, companyCardY + 8);

  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(companySubtitle, rightColX + 5, companyCardY + 13);

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Website: ${companyWebsite}`, rightColX + 5, companyCardY + 18);
  doc.text(`Email: ${companyEmail}`, rightColX + 5, companyCardY + 23);
  doc.text(`CR/Reg. No: ${companyReg}`, rightColX + 5, companyCardY + 28);

  // Verified badge
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(rightColX + 5, companyCardY + 21, 28, 5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIED EMPLOYER', rightColX + 19, companyCardY + 24.5, { align: 'center' });

  // Work Assignments title
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('Work Assignments', rightColX, companyCardY + 40);

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(rightColX, companyCardY + 43, rightColX + rightColW, companyCardY + 43);

  // Work table
  const tableData = data.shifts.map(shift => [
    toTitleCase(shift.title || shift.eventName || 'Event'),
    new Date(shift.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    toTitleCase(shift.location || 'On-site'),
    `${shift.hours.toFixed(0)}h`
  ]);

  doc.autoTable({
    startY: companyCardY + 46,
    head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
    body: tableData,
    tableWidth: rightColW,
    margin: { left: rightColX, right: margin },
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: darkText
    },
    alternateRowStyles: {
      fillColor: [250, 251, 252]
    },
    styles: {
      lineColor: [220, 220, 220],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
    }
  });

  const tableEndY = (doc as any).lastAutoTable.finalY + 6;

  // Total hours box
  doc.setFillColor(cream[0], cream[1], cream[2]);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1);
  doc.roundedRect(rightColX, tableEndY, rightColW, 18, 3, 3, 'FD');

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL VERIFIED WORK EXPERIENCE', rightColX + rightColW / 2, tableEndY + 5, { align: 'center' });

  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  doc.text(`${Math.round(data.totalHours)} ${data.totalHours === 1 ? 'Hour' : 'Hours'}`, rightColX + rightColW / 2, tableEndY + 13, { align: 'center' });

  // ===== BOTTOM SECTION =====
  const bottomY = 240;

  // QR Code (left)
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', margin + 5, bottomY, 18, 18);
    } catch {
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.rect(margin + 5, bottomY, 18, 18, 'S');
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.setFontSize(6);
      doc.text('QR', margin + 14, bottomY + 11, { align: 'center' });
    }
  } else {
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.rect(margin + 5, bottomY, 18, 18, 'S');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.setFontSize(6);
    doc.text('QR', margin + 14, bottomY + 11, { align: 'center' });
  }

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Scan to Verify', margin + 14, bottomY + 23, { align: 'center' });

  // Official Seal (center)
  const sealX = pageWidth / 2;
  const sealY = bottomY + 12;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.5);
  doc.circle(sealX, sealY, 14, 'S');
  doc.setLineWidth(0.8);
  doc.circle(sealX, sealY, 11, 'S');
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL', sealX, sealY - 2, { align: 'center' });
  doc.text('SEAL', sealX, sealY + 3, { align: 'center' });

  // Signature line (center)
  doc.setDrawColor(darkText[0], darkText[1], darkText[2]);
  doc.setLineWidth(0.5);
  doc.line(sealX - 20, bottomY + 28, sealX + 20, bottomY + 28);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', sealX, bottomY + 32, { align: 'center' });

  // Date of Issue (right)
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Date of Issue', pageWidth - margin - 5, bottomY + 5, { align: 'right' });

  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text(new Date(data.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), pageWidth - margin - 5, bottomY + 13, { align: 'right' });

  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.referenceNumber, pageWidth - margin - 5, bottomY + 20, { align: 'right' });

  // ===== FOOTER =====
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, 275, pageWidth - margin, 275);

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SmartShift Tracker', pageWidth / 2, 282, { align: 'center' });

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(7);
  doc.text('This certificate was generated digitally and is verifiable via QR code or online at smart.onestoneads.com', pageWidth / 2, 287, { align: 'center' });

  return doc.output('blob');
};
