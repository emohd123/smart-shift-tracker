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
  const margin = 12;
  let yPos = 0;

  const shortRef = shortenRefNumber(data.referenceNumber);
  const promoter = data.promoter;
  
  // Format issue date
  const dateToFormat = data.issueDate ? new Date(data.issueDate) : new Date();
  const issueDisplay = dateToFormat.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const partTimerIdDisplay = promoter?.unique_code || 'PT-' + shortRef;
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;
  let verifyQrDataUrl: string | null = null;
  try {
    verifyQrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
  } catch {
    verifyQrDataUrl = null;
  }

  // ===== COMPACT HEADER =====
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 38, 'F');
  
  // Accent bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK EXPERIENCE CERTIFICATE', pageWidth / 2, 14, { align: 'center' });

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text('Official Documentation of Professional Employment', pageWidth / 2, 22, { align: 'center' });

  // Info line
  doc.setFontSize(7);
  doc.text('Issue Date: ' + issueDisplay + '   |   ID: ' + partTimerIdDisplay + '   |   Ref: ' + shortRef, pageWidth / 2, 32, { align: 'center' });

  yPos = 46;

  // ===== COMPACT PROMOTER CARD =====
  const profileCardHeight = 38;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), profileCardHeight, 4, 4, 'FD');
  
  // Left accent
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, yPos, 3, profileCardHeight, 'F');

  let textStartX = margin + 8;

  // Profile Photo (smaller)
  if (promoter?.profile_photo_url) {
    try {
      const photoBase64 = await loadImageAsBase64(promoter.profile_photo_url);
      if (photoBase64) {
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(margin + 6, yPos + 4, 30, 30, 3, 3, 'F');
        doc.addImage(photoBase64, 'JPEG', margin + 8, yPos + 6, 26, 26);
        textStartX = margin + 42;
      }
    } catch {}
  }

  // Promoter Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.promoterName, textStartX, yPos + 12);

  // Badges inline
  let badgeX = textStartX;
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(badgeX, yPos + 16, 32, 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('PART-TIMER', badgeX + 16, yPos + 21, { align: 'center' });
  
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(badgeX + 35, yPos + 16, 28, 7, 3, 3, 'F');
  doc.text('VERIFIED', badgeX + 49, yPos + 21, { align: 'center' });

  // Details compact row
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  let details: string[] = [];
  if (promoter?.nationality) details.push(promoter.nationality);
  if (promoter?.age) details.push(promoter.age + 'y');
  if (promoter?.phone_number) details.push(promoter.phone_number);
  if (promoter?.email) details.push(promoter.email);
  doc.text(details.join('  •  '), textStartX, yPos + 32);

  // Total hours badge on right
  const totalBadgeW = 40;
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageWidth - margin - totalBadgeW - 4, yPos + 10, totalBadgeW, 18, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(Math.round(data.grandTotalHours) + 'h', pageWidth - margin - totalBadgeW / 2 - 4, yPos + 22, { align: 'center' });

  yPos += profileCardHeight + 8;

  // ===== COMPANIES SECTION =====
  for (let i = 0; i < data.companies.length; i++) {
    const company = data.companies[i];
    const cardTop = yPos;
    const cardWidth = pageWidth - (margin * 2);
    const headerHeight = 36;

    // Company header
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(margin, cardTop, cardWidth, headerHeight, 5, 5, 'F');

    let contentX = margin + 8;
    const logoSize = 24;

    // Company Logo
    if (company.company.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(company.company.logo_url);
        if (logoBase64) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin + 6, cardTop + 6, logoSize, logoSize, 3, 3, 'F');
          doc.addImage(logoBase64, 'PNG', margin + 8, cardTop + 8, logoSize - 4, logoSize - 4);
          contentX = margin + logoSize + 12;
        }
      } catch {}
    }

    // Hours Badge - top right
    const hBadgeW = 42;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin + cardWidth - hBadgeW - 6, cardTop + 6, hBadgeW, 14, 7, 7, 'F');
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(Math.round(company.totalHours) + ' Hrs', margin + cardWidth - hBadgeW / 2 - 6, cardTop + 15, { align: 'center' });

    // Company Name
    const maxNameW = margin + cardWidth - hBadgeW - contentX - 20;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    let displayName = company.company.name;
    while (doc.getTextWidth(displayName) > maxNameW && displayName.length > 8) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== company.company.name) displayName += '...';
    doc.text(displayName, contentX, cardTop + 13);

    // Registration + Contact row
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    let infoLine: string[] = [];
    if (company.company.registration_number) infoLine.push('Reg: ' + company.company.registration_number);
    if (company.company.phone_number) infoLine.push('Tel: ' + company.company.phone_number);
    if (company.company.email) infoLine.push(company.company.email);
    doc.text(infoLine.join('  |  '), contentX, cardTop + 26);

    // Table
    const tableStartY = cardTop + headerHeight + 4;
    const tableData = company.shifts.map(shift => [
      shift.title.length > 20 ? shift.title.slice(0, 18) + '...' : shift.title,
      new Date(shift.dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      (shift.location || 'On-site').length > 15 ? (shift.location || 'On-site').slice(0, 13) + '...' : (shift.location || 'On-site'),
      Math.round(shift.totalHours) + 'h'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Event', 'Date', 'Location', 'Hrs']],
      body: tableData,
      tableWidth: cardWidth - 4,
      margin: { left: margin + 2, right: margin + 2 },
      theme: 'plain',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3,
        lineWidth: 0,
        minCellHeight: 8
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        halign: 'center',
        textColor: [30, 41, 59],
        lineColor: [241, 245, 249],
        lineWidth: 0.3,
        minCellHeight: 7
      },
      bodyStyles: { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 55, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 18, fontStyle: 'bold', textColor: [79, 70, 229] }
      }
    });

    const tableBottom = (doc as any).lastAutoTable?.finalY || tableStartY + 20;
    
    // Card border
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, cardTop, cardWidth, tableBottom - cardTop + 6, 5, 5, 'S');

    yPos = tableBottom + 12;
  }

  // ===== COMPACT ACKNOWLEDGEMENT =====
  const ackY = yPos;
  
  // Signature box
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, ackY, 70, 22, 3, 3, 'FD');
  doc.setTextColor(180, 180, 190);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Part-Timer Signature', margin + 35, ackY + 13, { align: 'center' });

  // Signature if provided
  if (data.signature) {
    try {
      doc.addImage(data.signature, 'PNG', margin + 5, ackY + 2, 50, 18);
    } catch {}
  }

  // Date box
  doc.roundedRect(margin + 75, ackY, 45, 22, 3, 3, 'FD');
  doc.setTextColor(100, 100, 110);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Date', margin + 97.5, ackY + 7, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(issueDisplay, margin + 97.5, ackY + 16, { align: 'center' });

  // Declaration inline
  const declX = margin + 126;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.6);
  doc.roundedRect(declX, ackY, pageWidth - margin - declX, 22, 3, 3, 'FD');
  
  // Checkmark
  doc.setFillColor(34, 197, 94);
  doc.circle(declX + 8, ackY + 11, 5, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.2);
  doc.line(declX + 5.5, ackY + 11, declX + 7.5, ackY + 13.5);
  doc.line(declX + 7.5, ackY + 13.5, declX + 11, ackY + 8);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('VERIFIED', declX + 18, ackY + 10);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 70);
  doc.text('This certificate confirms completed', declX + 18, ackY + 15);
  doc.text('work for employment verification.', declX + 18, ackY + 19);

  // ===== FOOTER =====
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 285, pageWidth, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, 285, pageWidth, 285);

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Shift Tracker™ — Workforce Management Platform', margin, 291);
  doc.text('Ref: ' + shortRef, pageWidth - margin, 291, { align: 'right' });

  // Small QR near footer (optional)
  if (verifyQrDataUrl) {
    try {
      doc.addImage(verifyQrDataUrl, 'PNG', pageWidth - margin - 12, 287.5, 9.5, 9.5);
    } catch {}
  }

  return doc.output('blob');
}
