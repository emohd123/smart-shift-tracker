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
    const headerHeight = 48; // Increased height for better layout

    // Draw main header background with gradient effect
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(12, cardTop, cardWidth, headerHeight, 5, 5, 'F');
    
    // Add subtle bottom accent line
    doc.setFillColor(79, 70, 229);
    doc.rect(12, cardTop + headerHeight - 2, cardWidth, 2, 'F');

    let contentX = 24;
    const logoSize = 32;

    // Company Logo with white background container
    if (company.company.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(company.company.logo_url);
        if (logoBase64) {
          // White rounded container for logo
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(18, cardTop + 8, logoSize, logoSize, 4, 4, 'F');
          doc.addImage(logoBase64, 'PNG', 20, cardTop + 10, logoSize - 4, logoSize - 4);
          contentX = 18 + logoSize + 10;
        }
      } catch {
        // Continue without logo
      }
    }

    // Company Name - larger and bolder
    const companyName = company.company.name;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, contentX, cardTop + 16);

    // Registration Number Badge - positioned after company name
    const regNumber = company.company.registration_number;
    if (regNumber) {
      const displayReg = regNumber.length > 15 ? regNumber.slice(0, 14) + '…' : regNumber;
      const regWidth = doc.getTextWidth(displayReg) + 14;
      const regX = contentX + doc.getTextWidth(companyName) + 8;
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(regX, cardTop + 9, regWidth, 12, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(displayReg, regX + regWidth / 2, cardTop + 17, { align: 'center' });
    }

    // Total Hours Badge - positioned at right side, vertically centered
    const hoursBadgeWidth = 50;
    const hoursBadgeHeight = 18;
    const cardRight = 12 + cardWidth;
    const hoursBadgeX = cardRight - hoursBadgeWidth - 12;
    const hoursBadgeY = cardTop + (headerHeight - hoursBadgeHeight) / 2;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(hoursBadgeX, hoursBadgeY, hoursBadgeWidth, hoursBadgeHeight, 9, 9, 'F');
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(Math.round(company.totalHours) + ' Hours', hoursBadgeX + hoursBadgeWidth / 2, hoursBadgeY + 12, { align: 'center' });

    // Contact Information Row - below company name with icons feel
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(224, 231, 255);
    
    const phoneValue = company.company.phone_number;
    const emailValue = company.company.email;
    const contactY = cardTop + 32;
    
    if (phoneValue) {
      doc.text('Phone: ' + phoneValue, contentX, contactY);
    }
    
    if (emailValue) {
      const emailX = phoneValue ? contentX + 70 : contentX;
      doc.text('Email: ' + emailValue, emailX, contactY);
    }
    
    // If no contact info, show placeholder
    if (!phoneValue && !emailValue) {
      doc.setTextColor(180, 180, 220);
      doc.text('Contact information not available', contentX, contactY);
    }

    const tableStartY = cardTop + headerHeight + 10;
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
      tableWidth: cardWidth - 12,
      margin: { left: 18, right: 18 },
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6,
        lineWidth: 0,
        minCellHeight: 12
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        halign: 'center',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        minCellHeight: 10
      },
      bodyStyles: {
        fillColor: [248, 250, 252]
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 62, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 42 },
        2: { cellWidth: 55 },
        3: { cellWidth: 28, fontStyle: 'bold', textColor: [30, 64, 175] }
      },
      didDrawPage: function(data) {
        // Add rounded corners effect to table
      }
    });

    const tableBottom = (doc as any).lastAutoTable?.finalY || tableStartY + 24;
    const cardBottom = tableBottom + 12;
    
    // Draw elegant card border
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(1);
    doc.roundedRect(12, cardTop, cardWidth, cardBottom - cardTop, 5, 5, 'S');

    yPos = cardBottom + 16;
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
