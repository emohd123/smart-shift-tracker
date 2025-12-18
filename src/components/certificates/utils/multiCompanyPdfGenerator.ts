import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MultiCompanyCertificate } from '../types/certificate';

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
  return ref.slice(-8);
}

export async function generateMultiCompanyPDF(data: MultiCompanyCertificate): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  let yPos = 20;

  const shortRef = shortenRefNumber(data.referenceNumber);
  const promoter = data.promoter;
  
  // Format issue date - use current date if not provided
  const dateToFormat = data.issueDate ? new Date(data.issueDate) : new Date();
  const issueDisplay = dateToFormat.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  // Get promoter unique code
  const partTimerIdDisplay = promoter?.unique_code || data.referenceNumber.split('-')[0] || 'PT-' + shortRef;

  // ===== HEADER =====
  doc.setFillColor(92, 75, 241);
  doc.rect(0, 0, pageWidth, 55, 'F');
  doc.setFillColor(129, 140, 248);
  doc.rect(0, 55, pageWidth, 3, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK EXPERIENCE CERTIFICATE', pageWidth / 2, 20, { align: 'center' });

  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Documentation of Professional Employment', pageWidth / 2, 30, { align: 'center' });

  // Left side - Issue Date and Part Timer ID
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 255);
  doc.text('Issue Date: ' + issueDisplay, 16, 42);
  doc.text('Part Timer ID: ' + partTimerIdDisplay, 16, 48);

  // Platform name
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 255);
  doc.text('Smart Shift Tracker - Workforce Management Platform', pageWidth / 2, 50, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 70;

  // ===== PROMOTER INFO BOX =====
  const boxHeight = 52;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, yPos, pageWidth - 24, boxHeight, 3, 3, 'F');
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.5);
  doc.roundedRect(12, yPos, pageWidth - 24, boxHeight, 3, 3, 'S');

  let textStartX = 22;

  // Profile Photo
  if (promoter?.profile_photo_url) {
    try {
      const photoBase64 = await loadImageAsBase64(promoter.profile_photo_url);
      if (photoBase64) {
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(1.5);
        doc.roundedRect(18, yPos + 6, 40, 40, 2, 2, 'S');
        doc.addImage(photoBase64, 'JPEG', 20, yPos + 8, 36, 36);
        textStartX = 66;
      }
    } catch {
      // Continue without photo
    }
  }

  // Promoter Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.promoterName, textStartX, yPos + 14);

  // Badges Row
  let badgeX = textStartX;
  const badgeY = yPos + 20;

  // PART-TIMER badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(badgeX, badgeY, 38, 8, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PART-TIMER', badgeX + 19, badgeY + 5.5, { align: 'center' });
  badgeX += 42;

  // VERIFIED badge
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(badgeX, badgeY, 32, 8, 3, 3, 'F');
  doc.text('VERIFIED', badgeX + 16, badgeY + 5.5, { align: 'center' });

  // Details Row 1 - Nationality & Age
  doc.setTextColor(80, 80, 90);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let row1Parts: string[] = [];
  if (promoter?.nationality) row1Parts.push('Nationality: ' + promoter.nationality);
  if (promoter?.age) row1Parts.push('Age: ' + promoter.age + ' years');
  if (row1Parts.length > 0) {
    doc.text(row1Parts.join('   •   '), textStartX, yPos + 36);
  }

  // Details Row 2 - Contact Info
  let row2Parts: string[] = [];
  if (promoter?.phone_number) row2Parts.push('Phone: ' + promoter.phone_number);
  if (promoter?.email) row2Parts.push('Email: ' + promoter.email);
  if (row2Parts.length > 0) {
    doc.text(row2Parts.join('   •   '), textStartX, yPos + 45);
  }

  yPos += boxHeight + 10;

  // ===== WORK EXPERIENCE SUMMARY BAR =====
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, yPos, pageWidth - 24, 24, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, yPos, pageWidth - 24, 24, 4, 4, 'S');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Work Experience:', 22, yPos + 15);

  const summaryBadgeWidth = 48;
  const summaryBadgeX = pageWidth / 2 - summaryBadgeWidth / 2;
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(summaryBadgeX, yPos + 7, summaryBadgeWidth, 12, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(Math.round(data.grandTotalHours) + ' HOURS', summaryBadgeX + summaryBadgeWidth / 2, yPos + 15, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('across ' + data.companies.length + ' Organization' + (data.companies.length > 1 ? 's' : ''), pageWidth - 20, yPos + 15, { align: 'right' });

  yPos += 34;
  doc.setTextColor(0, 0, 0);

  // ===== COMPANIES SECTION =====
  for (let companyIndex = 0; companyIndex < data.companies.length; companyIndex++) {
    const company = data.companies[companyIndex];

    if (yPos > pageHeight - 110) {
      doc.addPage();
      yPos = 24;
    }

    const cardTop = yPos;
    const cardWidth = pageWidth - 24;
    const headerHeight = 28;

    doc.setFillColor(99, 102, 241);
    doc.roundedRect(12, cardTop, cardWidth, headerHeight, 4, 4, 'F');

    let contentX = 24;

    if (company.company.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(company.company.logo_url);
        if (logoBase64) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(18, cardTop + 6, 16, 16, 2, 2, 'F');
          doc.addImage(logoBase64, 'PNG', 19, cardTop + 7, 14, 14);
          contentX = 42;
        }
      } catch {
        // Continue without logo
      }
    }

    const companyName = company.company.name;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, contentX, cardTop + 12);

    const regNumber = company.company.registration_number || 'Reg Number';
    const regWidth = Math.min(doc.getTextWidth(regNumber) + 10, 46);
    const regX = contentX + doc.getTextWidth(companyName) + 6;
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(regX, cardTop + 6, regWidth, 10, 3, 3, 'F');
    doc.setFontSize(8);
    doc.text(regNumber.length > 12 ? regNumber.slice(0, 11) + '…' : regNumber, regX + regWidth / 2, cardTop + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.setFontSize(8);
    const phoneValue = company.company.phone_number || '—';
    const emailValue = company.company.email || '—';
    doc.text('Phone number: ' + phoneValue, contentX, cardTop + 20);
    doc.text('Email: ' + emailValue, contentX + 58, cardTop + 20);

    const hoursBadgeWidth = 38;
    const cardRight = 12 + cardWidth;
    const hoursBadgeX = cardRight - hoursBadgeWidth - 14;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(hoursBadgeX, cardTop + 8, hoursBadgeWidth, 12, 4, 4, 'F');
    doc.setDrawColor(129, 140, 248);
    doc.roundedRect(hoursBadgeX, cardTop + 8, hoursBadgeWidth, 12, 4, 4, 'S');
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(Math.round(company.totalHours) + ' Hours', hoursBadgeX + hoursBadgeWidth / 2, cardTop + 16, { align: 'center' });

    const tableStartY = cardTop + headerHeight + 12;
    const tableData = company.shifts.map(shift => [
      shift.title,
      new Date(shift.dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      shift.location || 'On-site',
      Math.round(shift.totalHours) + 'h'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
      body: tableData,
      tableWidth: cardWidth - 20,
      margin: { left: 20, right: 20 },
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5,
        lineWidth: 0.5,
        lineColor: [37, 99, 235]
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        halign: 'center',
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.4
      },
      bodyStyles: {
        fillColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [238, 242, 255]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25, fontStyle: 'bold' }
      }
    });

    const tableBottom = (doc as any).lastAutoTable?.finalY || tableStartY + 24;
    const cardBottom = tableBottom + 10;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.8);
    doc.roundedRect(12, cardTop, cardWidth, cardBottom - cardTop, 4, 4, 'S');

    yPos = cardBottom + 14;
    doc.setTextColor(0, 0, 0);
  }

  // ===== PART-TIMER ACKNOWLEDGEMENT =====
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = 30;
  }

  doc.setTextColor(60, 60, 70);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Part-Timer Acknowledgement', 12, yPos);
  yPos += 8;

  // Add signature if provided
  if (data.signature) {
    try {
      doc.text('Signature:', 12, yPos);
      doc.addImage(data.signature, 'PNG', 40, yPos - 8, 50, 20);
      yPos += 16;
    } catch {
      doc.text('Signature: _______________________', 12, yPos);
      yPos += 16;
    }
  } else {
    doc.text('Signature: _______________________', 12, yPos);
    yPos += 16;
  }

  // ===== DECLARATION BOX =====
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.8);
  doc.roundedRect(12, yPos, pageWidth - 24, 32, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text('DECLARATION', pageWidth / 2, yPos + 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 70);
  doc.text('This certificate confirms that the above-named individual has successfully completed', pageWidth / 2, yPos + 19, { align: 'center' });
  doc.text('the stated work assignments. This document is issued for employment verification purposes.', pageWidth / 2, yPos + 26, { align: 'center' });

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.3);
    doc.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 140);
    doc.text('This certificate was generated digitally by Smart Shift Tracker.', 12, pageHeight - 8);
    doc.text('Cert: ' + shortRef, pageWidth - 12, pageHeight - 8, { align: 'right' });
  }

  return doc.output('blob');
}
