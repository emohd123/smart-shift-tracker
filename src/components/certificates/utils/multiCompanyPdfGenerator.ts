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

// Draw a decorative accent line
function drawDecoLine(doc: jsPDF, x: number, y: number, width: number) {
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.8);
  doc.line(x, y, x + width * 0.3, y);
  doc.setDrawColor(16, 185, 129);
  doc.line(x + width * 0.35, y, x + width * 0.65, y);
  doc.setDrawColor(59, 130, 246);
  doc.line(x + width * 0.7, y, x + width, y);
}

export async function generateMultiCompanyPDF(data: MultiCompanyCertificate): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
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

  // ===== HEADER SECTION =====
  // Main gradient header background
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 62, 'F');
  
  // Decorative accent bar
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 62, pageWidth, 4, 'F');
  
  // Corner accent triangles for modern look
  doc.setFillColor(67, 56, 202); // Indigo-700
  doc.triangle(0, 0, 40, 0, 0, 40, 'F');
  doc.triangle(pageWidth, 0, pageWidth - 40, 0, pageWidth, 40, 'F');

  // Certificate title with shadow effect
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK EXPERIENCE', pageWidth / 2, 24, { align: 'center' });
  doc.setFontSize(22);
  doc.text('CERTIFICATE', pageWidth / 2, 36, { align: 'center' });

  // Decorative line under title
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 50, 42, pageWidth / 2 + 50, 42);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text('Official Documentation of Professional Employment History', pageWidth / 2, 50, { align: 'center' });

  // Header info badges - left side
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 55, 58, 8, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date: ' + issueDisplay, margin + 3, 60.5);

  // Header info badges - right side  
  doc.roundedRect(pageWidth - margin - 50, 55, 50, 8, 3, 3, 'F');
  doc.text('ID: ' + partTimerIdDisplay, pageWidth - margin - 47, 60.5);

  yPos = 76;

  // ===== PROMOTER PROFILE CARD =====
  const cardHeight = 60;
  
  // Card shadow effect
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin + 1, yPos + 1, pageWidth - (margin * 2), cardHeight, 6, 6, 'F');
  
  // Main card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), cardHeight, 6, 6, 'F');
  
  // Left accent bar
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(margin, yPos, 4, cardHeight, 6, 0, 'F');
  doc.rect(margin + 2, yPos, 2, cardHeight, 'F');

  let textStartX = margin + 14;

  // Profile Photo with elegant border
  if (promoter?.profile_photo_url) {
    try {
      const photoBase64 = await loadImageAsBase64(promoter.profile_photo_url);
      if (photoBase64) {
        // Photo container with gradient border effect
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(margin + 10, yPos + 7, 46, 46, 4, 4, 'F');
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin + 12, yPos + 9, 42, 42, 3, 3, 'F');
        doc.addImage(photoBase64, 'JPEG', margin + 14, yPos + 11, 38, 38);
        textStartX = margin + 64;
      }
    } catch {
      // Continue without photo
    }
  }

  // Promoter Name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.promoterName, textStartX, yPos + 18);

  // Status Badges
  let badgeX = textStartX;
  const badgeY = yPos + 24;

  // PART-TIMER badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(badgeX, badgeY, 42, 10, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PART-TIMER', badgeX + 21, badgeY + 7, { align: 'center' });
  badgeX += 46;

  // VERIFIED badge with checkmark feel
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(badgeX, badgeY, 38, 10, 5, 5, 'F');
  doc.text('VERIFIED', badgeX + 19, badgeY + 7, { align: 'center' });

  // Personal Details - Row 1
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let detailY = yPos + 42;
  let details1: string[] = [];
  if (promoter?.nationality) details1.push('Nationality: ' + promoter.nationality);
  if (promoter?.age) details1.push('Age: ' + promoter.age + ' years');
  if (details1.length > 0) {
    doc.text(details1.join('   |   '), textStartX, detailY);
  }

  // Personal Details - Row 2
  let details2: string[] = [];
  if (promoter?.phone_number) details2.push('Phone: ' + promoter.phone_number);
  if (promoter?.email) details2.push('Email: ' + promoter.email);
  if (details2.length > 0) {
    doc.text(details2.join('   |   '), textStartX, detailY + 10);
  }

  yPos += cardHeight + 12;

  // ===== EXPERIENCE SUMMARY BAR =====
  // Gradient background bar
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 28, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 28, 6, 6, 'S');

  // Left label
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL EXPERIENCE', margin + 10, yPos + 17);

  // Center hours badge - prominent
  const hoursBadgeWidth = 70;
  const hoursBadgeX = pageWidth / 2 - hoursBadgeWidth / 2;
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(hoursBadgeX, yPos + 6, hoursBadgeWidth, 16, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(Math.round(data.grandTotalHours) + ' HOURS', hoursBadgeX + hoursBadgeWidth / 2, yPos + 17, { align: 'center' });

  // Right organization count
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companies.length + ' Organization' + (data.companies.length > 1 ? 's' : ''), pageWidth - margin - 10, yPos + 17, { align: 'right' });

  yPos += 38;

  // ===== SECTION TITLE =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('WORK HISTORY', margin, yPos);
  drawDecoLine(doc, margin, yPos + 4, 50);
  yPos += 14;

  // ===== COMPANIES SECTION =====
  for (let companyIndex = 0; companyIndex < data.companies.length; companyIndex++) {
    const company = data.companies[companyIndex];

    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 25;
    }

    const cardTop = yPos;
    const cardWidth = pageWidth - (margin * 2);
    const headerHeight = 60;

    // Company card shadow
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin + 1, cardTop + 1, cardWidth, headerHeight, 8, 8, 'F');

    // Company header with gradient
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(margin, cardTop, cardWidth, headerHeight, 8, 8, 'F');
    
    // Subtle pattern overlay - top accent
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(margin, cardTop, cardWidth, 6, 8, 0, 'F');
    doc.rect(margin, cardTop + 4, cardWidth, 2, 'F');

    let contentX = margin + 14;
    const logoSize = 36;

    // Company Logo
    if (company.company.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(company.company.logo_url);
        if (logoBase64) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin + 8, cardTop + 12, logoSize, logoSize, 4, 4, 'F');
          doc.addImage(logoBase64, 'PNG', margin + 10, cardTop + 14, logoSize - 4, logoSize - 4);
          contentX = margin + logoSize + 16;
        }
      } catch {
        // Continue without logo
      }
    }

    // Hours Badge - positioned first at top right to reserve space
    const hBadgeWidth = 55;
    const hBadgeHeight = 20;
    const hBadgeX = margin + cardWidth - hBadgeWidth - 10;
    const hBadgeY = cardTop + 10;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(hBadgeX, hBadgeY, hBadgeWidth, hBadgeHeight, 10, 10, 'F');
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(Math.round(company.totalHours) + ' Hours', hBadgeX + hBadgeWidth / 2, hBadgeY + 13, { align: 'center' });

    // Calculate max width for company name (leave space for hours badge)
    const maxNameWidth = hBadgeX - contentX - 15;

    // Company Name - truncate if too long
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    let displayName = company.company.name;
    while (doc.getTextWidth(displayName) > maxNameWidth && displayName.length > 10) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== company.company.name) {
      displayName = displayName.trim() + '...';
    }
    doc.text(displayName, contentX, cardTop + 20);

    // Registration Badge - on second row below company name
    const regNumber = company.company.registration_number;
    if (regNumber) {
      const displayReg = regNumber.length > 14 ? regNumber.slice(0, 13) + '...' : regNumber;
      const regWidth = Math.min(doc.getTextWidth(displayReg) + 14, 70);
      
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(contentX, cardTop + 26, regWidth, 12, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(displayReg, contentX + regWidth / 2, cardTop + 34, { align: 'center' });
    }

    // Contact Info Row - bottom of header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(224, 231, 255);
    
    const contactY = cardTop + 50;
    const phone = company.company.phone_number;
    const email = company.company.email;
    
    let contactParts: string[] = [];
    if (phone) contactParts.push('Tel: ' + phone);
    if (email) contactParts.push('Email: ' + email);
    
    if (contactParts.length > 0) {
      doc.text(contactParts.join('   |   '), contentX, contactY);
    }

    const tableStartY = cardTop + headerHeight + 8;
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
      tableWidth: cardWidth - 8,
      margin: { left: margin + 4, right: margin + 4 },
      theme: 'plain',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 7,
        lineWidth: 0,
        minCellHeight: 14
      },
      styles: {
        fontSize: 9,
        cellPadding: 7,
        halign: 'center',
        textColor: [30, 41, 59],
        lineColor: [241, 245, 249],
        lineWidth: 0.5,
        minCellHeight: 12
      },
      bodyStyles: {
        fillColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 58, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 38 },
        2: { cellWidth: 50 },
        3: { cellWidth: 22, fontStyle: 'bold', textColor: [79, 70, 229] }
      }
    });

    const tableBottom = (doc as any).lastAutoTable?.finalY || tableStartY + 30;
    const cardBottom = tableBottom + 10;
    
    // Elegant card border
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(1.2);
    doc.roundedRect(margin, cardTop, cardWidth, cardBottom - cardTop, 8, 8, 'S');

    yPos = cardBottom + 14;
  }

  // ===== ACKNOWLEDGEMENT SECTION =====
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 30;
  }

  // Section title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PART-TIMER ACKNOWLEDGEMENT', margin, yPos);
  drawDecoLine(doc, margin, yPos + 4, 70);
  yPos += 14;

  // Signature area
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(margin, yPos, 100, 28, 4, 4, 'FD');

  if (data.signature) {
    try {
      doc.addImage(data.signature, 'PNG', margin + 5, yPos + 2, 60, 24);
    } catch {
      doc.setTextColor(180, 180, 190);
      doc.setFontSize(9);
      doc.text('Signature', margin + 50, yPos + 16, { align: 'center' });
    }
  } else {
    doc.setTextColor(180, 180, 190);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature', margin + 50, yPos + 16, { align: 'center' });
  }

  // Date box
  doc.roundedRect(margin + 110, yPos, 65, 28, 4, 4, 'FD');
  doc.setTextColor(100, 100, 110);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Date', margin + 142.5, yPos + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(issueDisplay, margin + 142.5, yPos + 20, { align: 'center' });

  yPos += 38;

  // ===== DECLARATION BOX =====
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 36, 6, 6, 'FD');

  // Green checkmark circle with checkmark
  doc.setFillColor(34, 197, 94);
  doc.circle(margin + 14, yPos + 18, 7, 'F');
  // Draw checkmark using lines
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  doc.line(margin + 11, yPos + 18, margin + 13.5, yPos + 21);
  doc.line(margin + 13.5, yPos + 21, margin + 18, yPos + 15);

  doc.setFontSize(12);
  doc.setTextColor(22, 163, 74);
  doc.text('OFFICIAL DECLARATION', margin + 28, yPos + 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 70);
  doc.text('This certificate confirms that the above-named individual has successfully completed the stated', margin + 28, yPos + 23);
  doc.text('work assignments. This document is issued for employment verification purposes.', margin + 28, yPos + 31);

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
    
    // Top line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(0, pageHeight - 18, pageWidth, pageHeight - 18);

    // Footer content
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Smart Shift Tracker - Workforce Management Platform', margin, pageHeight - 8);
    
    // Page number and ref
    doc.text('Page ' + i + ' of ' + pageCount + '  |  Ref: ' + shortRef, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return doc.output('blob');
}
