import jsPDF from "jspdf";
import "jspdf-autotable";
import { WorkExperienceData } from "../types/certificate";
import QRCode from "qrcode";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const addWorkExperienceHeader = (doc: jsPDF) => {
  // Company header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("WORK EXPERIENCE CERTIFICATE", 105, 30, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Official Employment Verification Document", 105, 40, { align: "center" });
  
  // Add a border line
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);
  
  return 60;
};

const addEmployeeInfo = (doc: jsPDF, data: WorkExperienceData, startY: number): number => {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE INFORMATION", 20, startY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const infoY = startY + 10;
  doc.text(`Employee Name: ${data.promoterName}`, 20, infoY);
  doc.text(`Reference Number: ${data.referenceNumber}`, 20, infoY + 8);
  doc.text(`Issue Date: ${data.issueDate}`, 20, infoY + 16);
  doc.text(`Work Period: ${data.workPeriod.startDate} to ${data.workPeriod.endDate}`, 20, infoY + 24);
  
  return infoY + 35;
};

const addWorkSummary = (doc: jsPDF, data: WorkExperienceData, startY: number): number => {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("WORK SUMMARY", 20, startY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const summaryY = startY + 10;
  doc.text(`Total Hours Worked: ${data.totalHours} hours`, 20, summaryY);
  doc.text(`Total Shifts Completed: ${data.totalShifts} shifts`, 20, summaryY + 8);
  doc.text(`Average Hours per Shift: ${data.timeLogs.averageHoursPerShift} hours`, 20, summaryY + 16);
  doc.text(`Most Productive Day: ${data.timeLogs.mostProductiveDay}`, 20, summaryY + 24);
  doc.text(`Performance Rating: ${data.performanceRating}/5`, 20, summaryY + 32);
  
  // Roles section
  doc.text("Positions Held:", 20, summaryY + 45);
  data.roles.forEach((role, index) => {
    doc.text(`• ${role}`, 25, summaryY + 53 + (index * 8));
  });
  
  // Locations section
  const locationsStartY = summaryY + 53 + (data.roles.length * 8) + 8;
  doc.text("Work Locations:", 20, locationsStartY);
  data.locations.forEach((location, index) => {
    doc.text(`• ${location}`, 25, locationsStartY + 8 + (index * 8));
  });
  
  return locationsStartY + 8 + (data.locations.length * 8) + 10;
};

const addTimesheetTable = (doc: jsPDF, data: WorkExperienceData, startY: number): Promise<number> => {
  return new Promise((resolve) => {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DETAILED TIMESHEET RECORD", 20, startY);
    
    const tableData = data.shifts.map(shift => [
      shift.date,
      shift.title,
      shift.location || 'N/A',
      shift.timeLog?.checkIn || 'N/A',
      shift.timeLog?.checkOut || 'N/A',
      shift.hours.toFixed(2)
    ]);
    
    doc.autoTable({
      head: [['Date', 'Position', 'Location', 'Check In', 'Check Out', 'Hours']],
      body: tableData,
      startY: startY + 10,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 20, right: 20 },
      didFinishPageBreak: (data) => {
        if (data.cursor) {
          resolve(data.cursor.y + 10);
        }
      }
    });
    
    // If no page break occurred, resolve with the final Y position
    setTimeout(() => {
      resolve(startY + 10 + (tableData.length * 8) + 30);
    }, 100);
  });
};

const addVerificationSection = async (doc: jsPDF, data: WorkExperienceData, startY: number): Promise<number> => {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("VERIFICATION & AUTHENTICITY", 20, startY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const verifyY = startY + 15;
  doc.text("This certificate is issued to verify the employment history and work hours", 20, verifyY);
  doc.text("of the above-named employee. All information has been verified against", 20, verifyY + 8);
  doc.text("our time tracking and shift management systems.", 20, verifyY + 16);
  
  doc.text(`Manager Contact: ${data.managerContact}`, 20, verifyY + 30);
  doc.text("Digital Signature: [Verified]", 20, verifyY + 38);
  
  // Generate QR code for verification
  const verifyUrl = `${window.location.origin}/verify-certificate/${data.referenceNumber}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 60,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    doc.addImage(qrCodeDataUrl, 'PNG', 150, verifyY + 20, 30, 30);
    doc.setFontSize(8);
    doc.text("Scan to verify", 155, verifyY + 55);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
  
  return verifyY + 65;
};

export const generateWorkExperiencePDF = async (data: WorkExperienceData): Promise<Blob> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Set document properties
  doc.setProperties({
    title: `Work Experience Certificate - ${data.promoterName}`,
    subject: 'Official Work Experience Certificate',
    author: 'Human Resources Department',
    creator: 'Certificate Management System'
  });
  
  // Add content sections
  let currentY = addWorkExperienceHeader(doc);
  currentY = addEmployeeInfo(doc, data, currentY);
  currentY = addWorkSummary(doc, data, currentY);
  currentY = await addTimesheetTable(doc, data, currentY);
  await addVerificationSection(doc, data, currentY);
  
  return doc.output('blob');
};