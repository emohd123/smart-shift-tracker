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

  // ===== HEADER =====
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 48, 'F');

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 48, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK EXPERIENCE CERTIFICATE', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Documentation of Professional Employment', pageWidth / 2, 34, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 255);
  doc.text('Smart Shift Tracker - Workforce Management Platform', pageWidth / 2, 44, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 58;

  // ===== PROMOTER INFO BOX =====
  const promoter = data.promoter;
  const boxHeight = 58;

  doc.setFillColor(250, 250, 252);
  doc.roundedRect(12, yPos, pageWidth - 24, boxHeight, 3, 3, 'F');
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, yPos, pageWidth - 24, boxHeight, 3, 3, 'S');

  let textStartX = 20;

  if (promoter?.profile_photo_url) {
    try {
      const photoBase64 = await loadImageAsBase64(promoter.profile_photo_url);
      if (photoBase64) {
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(1.2);
        doc.roundedRect(17, yPos + 5, 46, 46, 2, 2, 'S');
        doc.addImage(photoBase64, 'JPEG', 19, yPos + 7, 42, 42);
        textStartX = 70;
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

  // Badges Row - with more spacing from name
  let badgeX = textStartX;
  const badgeY = yPos + 20;

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(badgeX, badgeY, 36, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PART-TIMER', badgeX + 18, badgeY + 5.5, { align: 'center' });
  badgeX += 39;

  doc.setFillColor(59, 130, 246);
  doc.roundedRect(badgeX, badgeY, 28, 8, 2, 2, 'F');
  doc.text('VERIFIED', badgeX + 14, badgeY + 5.5, { align: 'center' });
  badgeX += 31;

  if (promoter?.unique_code) {
    doc.setFillColor(99, 102, 241);
    const codeText = promoter.unique_code;
    doc.setFontSize(7);
    const codeWidth = doc.getTextWidth(codeText) + 8;
    doc.roundedRect(badgeX, badgeY, codeWidth, 8, 2, 2, 'F');
    doc.text(codeText, badgeX + codeWidth / 2, badgeY + 5.5, { align: 'center' });
  }

  // Details Row 1 - Nationality & Age
  doc.setTextColor(60, 60, 70);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let row1Parts: string[] = [];
  if (promoter?.nationality) row1Parts.push('Nationality: ' + promoter.nationality);
  if (promoter?.age) row1Parts.push('Age: ' + promoter.age + ' years');
  if (row1Parts.length > 0) {
    doc.text(row1Parts.join('   •   '), textStartX, yPos + 38);
  }

  // Details Row 2 - Contact Info
  let row2Parts: string[] = [];
  if (promoter?.phone_number) row2Parts.push('Phone: ' + promoter.phone_number);
  if (promoter?.email) row2Parts.push('Email: ' + promoter.email);
  if (row2Parts.length > 0) {
    doc.text(row2Parts.join('   •   '), textStartX, yPos + 48);
  }

  // Right side panel - Issue Date & Cert Number
  const rightPanelX = pageWidth - 55;
  
  // Issue date section
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(rightPanelX, yPos + 5, 45, 22, 2, 2, 'F');
  
  doc.setTextColor(80, 80, 90);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ISSUE DATE', rightPanelX + 22.5, yPos + 12, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 50);
  const issueDate = new Date(data.issueDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(issueDate, rightPanelX + 22.5, yPos + 21, { align: 'center' });

  // Certificate number section
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(rightPanelX, yPos + 30, 45, 22, 2, 2, 'F');
  
  doc.setTextColor(80, 80, 90);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CERT NO.', rightPanelX + 22.5, yPos + 37, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text(shortRef, rightPanelX + 22.5, yPos + 47, { align: 'center' });

  yPos += boxHeight + 8;

  // ===== WORK EXPERIENCE SUMMARY =====
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(12, yPos, pageWidth - 24, 22, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Work Experience:', 20, yPos + 14);

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(82, yPos + 5, 50, 12, 2, 2, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(Math.round(data.grandTotalHours) + ' HOURS', 107, yPos + 14, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('across ' + data.companies.length + ' Organization' + (data.companies.length > 1 ? 's' : ''), pageWidth - 20, yPos + 14, { align: 'right' });

  yPos += 30;

  // ===== COMPANIES SECTION =====
  for (let companyIndex = 0; companyIndex < data.companies.length; companyIndex++) {
    const company = data.companies[companyIndex];

    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(99, 102, 241);
    doc.roundedRect(12, yPos, pageWidth - 24, 20, 2, 2, 'F');

    let companyNameX = 20;

    if (company.company.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(company.company.logo_url);
        if (logoBase64) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(15, yPos + 3, 14, 14, 1, 1, 'F');
          doc.addImage(logoBase64, 'PNG', 16, yPos + 4, 12, 12);
          companyNameX = 34;
        }
      } catch {
        // Continue without logo
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company.name, companyNameX, yPos + 13);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - 50, yPos + 5, 32, 10, 2, 2, 'F');
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(Math.round(company.totalHours) + ' hrs', pageWidth - 34, yPos + 12, { align: 'center' });

    yPos += 24;

    const tableData = company.shifts.map(shift => [
      shift.title,
      new Date(shift.dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      shift.location || 'On-site',
      Math.round(shift.totalHours) + 'h'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Event / Campaign', 'Date', 'Location', 'Hours']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 5
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        halign: 'left',
        textColor: [40, 40, 50]
      },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 55 },
        3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 12, right: 12 },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
    yPos += 14;
  }

  // ===== DECLARATION =====
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 30;
  }

  yPos += 6;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.6);
  doc.roundedRect(12, yPos, pageWidth - 24, 30, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('DECLARATION', pageWidth / 2, yPos + 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 60);
  doc.text('This certificate confirms that the above-named individual has successfully completed', pageWidth / 2, yPos + 18, { align: 'center' });
  doc.text('the stated work assignments. This document is issued for employment verification purposes.', pageWidth / 2, yPos + 25, { align: 'center' });

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(180, 180, 190);
    doc.setLineWidth(0.4);
    doc.line(12, pageHeight - 16, pageWidth - 12, pageHeight - 16);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text('This certificate was generated digitally by Smart Shift Tracker.', 12, pageHeight - 10);
    doc.text('Cert: ' + shortRef, pageWidth / 2, pageHeight - 10, { align: 'center' });
    if (pageCount > 1) {
      doc.text('Page ' + i + ' of ' + pageCount, pageWidth - 12, pageHeight - 10, { align: 'right' });
    }
  }

  return doc.output('blob');
}
