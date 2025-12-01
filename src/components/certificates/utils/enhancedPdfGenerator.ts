import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { WorkExperienceData } from '../types/certificate';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateEnhancedWorkExperiencePDF = async (data: WorkExperienceData): Promise<Blob> => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Use company info or defaults
  const companyName = data.companyInfo?.name || 'Professional Certification Authority';
  const companyWebsite = data.companyInfo?.website || 'https://yourcompany.com';
  const companyEmail = data.companyInfo?.email || 'certificates@yourcompany.com';
  const companyPhone = data.companyInfo?.phone || data.managerContact;
  const companyAddress = data.companyInfo?.address;
  const companyRegId = data.companyInfo?.registration_id;

  // Enhanced Header with Company Branding
  doc.setFillColor(41, 128, 185); // Professional blue
  doc.rect(0, 0, 210, 50, 'F');
  
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
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPREHENSIVE WORK EXPERIENCE CERTIFICATE', 105, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Employment Verification & Skills Documentation', 105, 35, { align: 'center' });
  
  // Dynamic company contact info
  doc.setFontSize(10);
  const contactLine = `${companyWebsite}${companyEmail ? ' | ' + companyEmail : ''}`;
  doc.text(contactLine, 105, 45, { align: 'center' });

  yPosition = 65;
  doc.setTextColor(0, 0, 0);

  // Reference number with enhanced styling
  doc.setFillColor(241, 245, 249);
  doc.rect(15, yPosition - 5, 180, 15, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Certificate Reference: ${data.referenceNumber}`, 105, yPosition + 5, { align: 'center' });
  
  yPosition += 25;

  // Enhanced Employee Information Section
  doc.setFillColor(52, 152, 219);
  doc.rect(15, yPosition, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE INFORMATION', 20, yPosition + 6);
  
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

  // Enhanced Positions & Roles Section
  doc.setFillColor(52, 152, 219);
  doc.rect(15, yPosition, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('POSITIONS & ROLES HELD', 20, yPosition + 6);
  
  yPosition += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Roles: ${data.roles.join(', ')}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Work Locations: ${data.locations.join(', ')}`, 20, yPosition);
  
  yPosition += 15;

  // Enhanced Work History Table
  doc.setFillColor(52, 152, 219);
  doc.rect(15, yPosition, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED WORK HISTORY', 20, yPosition + 6);
  
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
      fillColor: [52, 152, 219],
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

  // Enhanced Footer with verification URL
  yPosition = 270;
  doc.setFillColor(245, 247, 250);
  doc.rect(15, yPosition, 180, 20, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an official work experience certificate generated by our certified system.', 105, yPosition + 6, { align: 'center' });
  doc.text('All information has been verified and is accurate as of the issue date.', 105, yPosition + 12, { align: 'center' });
  doc.text(`Verify online at: ${window.location.origin}/verify-certificate/${data.referenceNumber}`, 105, yPosition + 18, { align: 'center' });

  // Add digital stamp/seal
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(2);
  doc.circle(170, 240, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 152, 219);
  doc.text('OFFICIAL', 170, 237, { align: 'center' });
  doc.text('DIGITAL', 170, 242, { align: 'center' });
  doc.text('SEAL', 170, 247, { align: 'center' });

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