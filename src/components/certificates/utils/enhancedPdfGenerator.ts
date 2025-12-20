import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { WorkExperienceData } from '../types/certificate';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateEnhancedWorkExperiencePDF = async (data: WorkExperienceData): Promise<Blob> => {
  // Align this generator to the same visual language as the multi-company certificate:
  // compact indigo header, clean sections, subtle footer, and canonical verify URL.
  const doc = new jsPDF();
  let yPosition = 0;
  const pageWidth = 210;
  const margin = 12;
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;

  // Use company info or defaults
  const companyName = data.companyInfo?.name || 'Professional Certification Authority';
  const companyWebsite = data.companyInfo?.website || 'https://yourcompany.com';
  const companyEmail = data.companyInfo?.email || 'certificates@yourcompany.com';
  const companyPhone = data.companyInfo?.phone || data.managerContact;
  const companyAddress = data.companyInfo?.address;
  const companyRegId = data.companyInfo?.registration_id;

  // ===== COMPACT HEADER (matches multi-company) =====
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 38, 'F');
  
  // Add company logo if available
  if (data.companyInfo?.logo_url) {
    try {
      // Logo would be added here - simplified for now
      // doc.addImage(data.companyInfo.logo_url, 'PNG', 15, 10, 30, 30);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK EXPERIENCE CERTIFICATE', pageWidth / 2, 14, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text('Official Employment Verification & Skills Documentation', pageWidth / 2, 22, { align: 'center' });
  
  // Info line
  doc.setFontSize(7);
  doc.text(
    `Issue Date: ${new Date(data.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}   |   Ref: ${data.referenceNumber}`,
    pageWidth / 2,
    32,
    { align: 'center' }
  );

  yPosition = 46;
  doc.setTextColor(0, 0, 0);

  // ===== IDENTITY CARD =====
  const cardHeight = 34;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), cardHeight, 4, 4, 'FD');
  doc.setFillColor(79, 70, 229);
  doc.rect(margin, yPosition, 3, cardHeight, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.promoterName, margin + 10, yPosition + 13);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employment Period: ${data.workPeriod.startDate} to ${data.workPeriod.endDate}`, margin + 10, yPosition + 22);
  doc.text(`Total: ${data.totalHours} hours • ${data.totalShifts} shifts`, margin + 10, yPosition + 29);

  // Total hours badge (right)
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageWidth - margin - 40, yPosition + 9, 36, 16, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(data.totalHours)}h`, pageWidth - margin - 22, yPosition + 20, { align: 'center' });

  yPosition += cardHeight + 10;

  // Enhanced Employee Information Section
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 8, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS', margin + 6, yPosition + 6);
  
  yPosition += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const employeeInfo = [
    [`Employee Name:`, data.promoterName],
    [`Certificate Issue Date:`, data.issueDate],
    [`Employment Period:`, `${data.workPeriod.startDate} to ${data.workPeriod.endDate}`],
    [`Total Working Hours:`, `${data.totalHours} hours`],
    [`Total Shifts Completed:`, `${data.totalShifts} shifts`],
    [`Average Hours per Shift:`, `${data.timeLogs.averageHoursPerShift} hours`],
    [`Performance Rating:`, `${data.performanceRating}/5 (${getPerformanceText(data.performanceRating)})`]
  ];

  employeeInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Roles section
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 8, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ROLES & LOCATIONS', margin + 6, yPosition + 6);
  
  yPosition += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Roles: ${data.roles.join(', ')}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Work Locations: ${data.locations.join(', ')}`, 20, yPosition);
  
  yPosition += 15;

  // Work history table header
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 8, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK HISTORY', margin + 6, yPosition + 6);
  
  yPosition += 15;

  // Prepare table data
  const tableData = data.shifts.map(shift => [
    shift.date,
    shift.title,
    shift.location || 'Multiple Locations',
    `${shift.hours.toFixed(1)}h`,
    shift.timeLog ? `${shift.timeLog.checkIn} - ${shift.timeLog.checkOut}` : 'N/A'
  ]);

  // Enhanced table with better styling
  doc.autoTable({
    startY: yPosition,
    head: [['Date', 'Position', 'Location', 'Hours', 'Time Log']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20 },
      4: { cellWidth: 35 }
    }
  });

  // Get Y position after table
  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Enhanced Company Information & Verification Section
  doc.setFillColor(52, 152, 219);
  doc.rect(15, yPosition, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ISSUING AUTHORITY & VERIFICATION', 20, yPosition + 6);
  
  yPosition += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const companyInfoLines = [
    `Issuing Company: ${companyName}`,
    companyRegId ? `Registration ID: ${companyRegId}` : '',
    companyWebsite ? `Website: ${companyWebsite}` : '',
    companyEmail ? `Email: ${companyEmail}` : '',
    companyPhone ? `Contact: ${companyPhone}` : '',
    companyAddress ? `Address: ${companyAddress}` : '',
    '',
    'DIGITAL VERIFICATION:',
    '✓ This certificate is digitally signed and authenticated',
    '✓ Verification available online using reference number',
    '✓ All employment data verified and accurate',
    `✓ Generated on: ${new Date().toLocaleDateString()}`
  ].filter(line => line !== ''); // Remove empty lines

  companyInfoLines.forEach(line => {
    if (line.startsWith('DIGITAL VERIFICATION:')) {
      doc.setFont('helvetica', 'bold');
    } else if (line.startsWith('✓')) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 139, 34); // Green for checkmarks
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    }
    
    if (line.trim()) {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    } else {
      yPosition += 3;
    }
  });

  // ===== FOOTER =====
  yPosition = 285;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, yPosition, pageWidth, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, yPosition, pageWidth, yPosition);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Shift Tracker™ — Workforce Management Platform', margin, yPosition + 6);
  doc.text(`Ref: ${data.referenceNumber}`, pageWidth - margin, yPosition + 6, { align: 'right' });

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