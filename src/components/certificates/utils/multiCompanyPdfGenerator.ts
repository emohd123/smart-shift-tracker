import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MultiCompanyCertificate } from '../types/certificate';
import QRCode from 'qrcode';

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Shorten certificate reference number
function shortenRefNumber(ref: string): string {
  const parts = ref.split('-');
  if (parts.length >= 3) {
    return parts[parts.length - 1];
  }
  return ref.slice(-6);
}

export async function generateMultiCompanyPDF(data: MultiCompanyCertificate): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const cardWidth = pageWidth - (margin * 2);
  let yPos = 0;

  // Official color palette
  const navy: [number, number, number] = [13, 33, 55];
  const gold: [number, number, number] = [184, 134, 11];
  const darkText: [number, number, number] = [26, 26, 46];
  const mutedText: [number, number, number] = [74, 85, 104];
  const lineColor: [number, number, number] = [201, 209, 220];
  const success: [number, number, number] = [13, 92, 47];

  const shortRef = shortenRefNumber(data.referenceNumber);
  const promoter = data.promoter;
  
  // Format issue date
  const dateToFormat = data.issueDate ? new Date(data.issueDate) : new Date();
  const issueDisplay = dateToFormat.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const yearDisplay = dateToFormat.getFullYear().toString();
  
  const partTimerIdDisplay = promoter?.unique_code || 'PT-' + shortRef;
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;
  
  // Generate QR code
  let verifyQrDataUrl: string | null = null;
  try {
    verifyQrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  } catch {
    verifyQrDataUrl = null;
  }

  // ===== SUBTLE DOCUMENT FRAME (no ornaments) =====
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.25);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28, 'S');

  // ===== HEADER BANNER =====
  yPos = 18;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, yPos, cardWidth, 28, 'F');
  
  // Gold accent line at bottom of header
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(margin, yPos + 28, cardWidth, 1.5, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF EMPLOYMENT', pageWidth / 2, yPos + 13, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Documentation of Professional Work Experience', pageWidth / 2, yPos + 22, { align: 'center' });

  // Official seal (right side of header)
  const sealX = pageWidth - margin - 18;
  const sealY = yPos + 14;
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
  doc.setFontSize(4);
  doc.text(yearDisplay, sealX, sealY + 6, { align: 'center' });

  yPos = 52;

  // ===== DOCUMENT METADATA BAR =====
  doc.setFillColor(247, 249, 252);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, cardWidth, 11, 'FD');
  
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  
  const metaItems = [
    `DOCUMENT ID: ${partTimerIdDisplay}`,
    `REFERENCE: ${shortRef}`,
    `ISSUE DATE: ${issueDisplay}`,
    `STATUS: VALID`
  ];
  
  const metaWidth = cardWidth / 4;
  metaItems.forEach((item, i) => {
    doc.text(item, margin + (metaWidth * i) + metaWidth / 2, yPos + 7, { align: 'center' });
  });

  yPos = 68;

  // ===== CERTIFICATION STATEMENT =====
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const statement = `This is to certify that ${data.promoterName} has successfully completed the work assignments detailed herein, demonstrating professional competence and dedication in their role as a Part-Timer.`;
  const splitStatement = doc.splitTextToSize(statement, cardWidth - 10);
  doc.text(splitStatement, pageWidth / 2, yPos, { align: 'center' });

  yPos += splitStatement.length * 4 + 6;

  // ===== IDENTITY CARD =====
  const profileCardHeight = 28;
  doc.setFillColor(255, 254, 248);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, cardWidth, profileCardHeight, 'FD');
  
  // Left border accent
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, yPos, 3, profileCardHeight, 'F');

  let textStartX = margin + 8;

  // Profile Photo
  if (promoter?.profile_photo_url) {
    try {
      const photoBase64 = await loadImageAsBase64(promoter.profile_photo_url);
      if (photoBase64) {
        doc.setDrawColor(navy[0], navy[1], navy[2]);
        doc.setLineWidth(0.5);
        doc.rect(margin + 6, yPos + 3, 22, 22, 'S');
        doc.addImage(photoBase64, 'JPEG', margin + 7, yPos + 4, 20, 20);
        textStartX = margin + 32;
      }
    } catch {}
  }

  // Name
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text(data.promoterName, textStartX, yPos + 10);

  // Badges
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(textStartX, yPos + 13, 20, 4.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('PART-TIMER', textStartX + 10, yPos + 16.2, { align: 'center' });
  
  doc.setFillColor(success[0], success[1], success[2]);
  doc.rect(textStartX + 23, yPos + 13, 18, 4.5, 'F');
  doc.text('✓ VERIFIED', textStartX + 32, yPos + 16.2, { align: 'center' });

  // Details row
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const details: string[] = [];
  if (promoter?.nationality) details.push(promoter.nationality);
  if (promoter?.age) details.push(promoter.age + ' years');
  if (promoter?.phone_number) details.push(promoter.phone_number);
  if (promoter?.email) details.push(promoter.email);
  doc.text(details.join('  •  '), textStartX, yPos + 24);

  // Total hours badge (right)
  const hoursBadgeX = pageWidth - margin - 32;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(hoursBadgeX, yPos + 4, 28, 18, 'F');
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.rect(hoursBadgeX, yPos + 4, 28, 18, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(data.grandTotalHours)}`, hoursBadgeX + 14, yPos + 13, { align: 'center' });
  doc.setFontSize(5);
  doc.text('TOTAL HOURS', hoursBadgeX + 14, yPos + 18, { align: 'center' });

  yPos += profileCardHeight + 6;

  // ===== SECTION HEADER - EMPLOYMENT RECORD =====
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 4, margin + 55, yPos + 4);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYMENT RECORD', margin, yPos + 2);
  
  yPos += 10;

  // ===== COMPANIES SECTION =====
  for (let i = 0; i < data.companies.length; i++) {
    const company = data.companies[i];
    const cardTop = yPos;
    const headerHeight = 22;

    // Company header
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, cardTop, cardWidth, headerHeight, 'FD');

    let contentX = margin + 6;
    const logoSize = 16;

    // Company Logo
    if (company.company.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(company.company.logo_url);
        if (logoBase64) {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
          doc.rect(margin + 4, cardTop + 3, logoSize, logoSize, 'FD');
          doc.addImage(logoBase64, 'PNG', margin + 5, cardTop + 4, logoSize - 2, logoSize - 2);
          contentX = margin + logoSize + 10;
        }
      } catch {}
    }

    // Hours Badge - top right
    const hBadgeW = 32;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(navy[0], navy[1], navy[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin + cardWidth - hBadgeW - 4, cardTop + 5, hBadgeW, 10, 'FD');
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(Math.round(company.totalHours) + ' hrs', margin + cardWidth - hBadgeW / 2 - 4, cardTop + 12, { align: 'center' });

    // Company Name
    const maxNameW = margin + cardWidth - hBadgeW - contentX - 15;
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let displayName = company.company.name;
    while (doc.getTextWidth(displayName) > maxNameW && displayName.length > 8) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== company.company.name) displayName += '...';
    doc.text(displayName, contentX, cardTop + 10);

    // Registration + Contact row
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    const infoLine: string[] = [];
    if (company.company.registration_number) infoLine.push('Reg: ' + company.company.registration_number);
    if (company.company.phone_number) infoLine.push('Tel: ' + company.company.phone_number);
    if (company.company.email) infoLine.push(company.company.email);
    doc.text(infoLine.join('  |  '), contentX, cardTop + 18);

    // Table
    const tableStartY = cardTop + headerHeight + 2;
    const tableData = company.shifts.map(shift => [
      shift.title.length > 22 ? shift.title.slice(0, 20) + '...' : shift.title,
      new Date(shift.dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      (shift.location || 'On-site').length > 16 ? (shift.location || 'On-site').slice(0, 14) + '...' : (shift.location || 'On-site'),
      Math.round(shift.totalHours) + 'h'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
      body: tableData,
      tableWidth: cardWidth,
      margin: { left: margin, right: margin },
      theme: 'plain',
      headStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5,
        lineWidth: 0,
        minCellHeight: 6
      },
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        halign: 'center',
        textColor: darkText,
        lineColor: lineColor,
        lineWidth: 0.2,
        minCellHeight: 6
      },
      bodyStyles: { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 68, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 34 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20, fontStyle: 'bold', textColor: navy }
      }
    });

    const tableBottom = (doc as any).lastAutoTable?.finalY || tableStartY + 15;
    
    // Card border
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(0.6);
    doc.rect(margin, cardTop, cardWidth, tableBottom - cardTop + 4, 'S');

    yPos = tableBottom + 8;
  }

  // ===== BOTTOM SECTION - SIGNATURE & VERIFICATION =====
  // Keep it near the bottom for short certificates (cleaner / more official).
  const bottomY = Math.max(yPos, 250);
  
  // Signature box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(margin, bottomY, 52, 20, 'FD');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED SIGNATURE', margin + 26, bottomY + 4, { align: 'center' });
  doc.setDrawColor(darkText[0], darkText[1], darkText[2]);
  doc.setLineWidth(0.4);
  doc.line(margin + 4, bottomY + 16, margin + 48, bottomY + 16);
  
  // Signature if provided
  if (data.signature) {
    try {
      doc.addImage(data.signature, 'PNG', margin + 6, bottomY + 5, 40, 10);
    } catch {}
  }

  // Date box
  doc.setFillColor(247, 249, 252);
  doc.rect(margin + 55, bottomY, 32, 20, 'FD');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.text('DATE OF ISSUE', margin + 71, bottomY + 4, { align: 'center' });
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(issueDisplay, margin + 71, bottomY + 13, { align: 'center' });

  // Verification box
  const verifyBoxX = margin + 90;
  const verifyBoxW = cardWidth - 90;
  doc.setFillColor(240, 244, 248);
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.6);
  doc.rect(verifyBoxX, bottomY, verifyBoxW, 20, 'FD');
  
  // Checkmark circle
  doc.setFillColor(success[0], success[1], success[2]);
  doc.circle(verifyBoxX + 7, bottomY + 10, 4.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('✓', verifyBoxX + 7, bottomY + 12, { align: 'center' });
  
  // Verification text
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHENTICATED', verifyBoxX + 16, bottomY + 8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('This certificate is digitally verified.', verifyBoxX + 16, bottomY + 13);
  doc.text('Scan QR code to verify authenticity.', verifyBoxX + 16, bottomY + 17);
  
  // QR Code
  if (verifyQrDataUrl) {
    try {
      doc.addImage(verifyQrDataUrl, 'PNG', pageWidth - margin - 17, bottomY + 2, 14, 14);
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
  doc.text(`Document Ref: ${shortRef}`, pageWidth - margin, footerY + 5, { align: 'right' });

  return doc.output('blob');
}
