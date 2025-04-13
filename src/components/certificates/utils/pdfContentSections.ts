
import { jsPDF } from "jspdf";

/**
 * Adds the professional experience section to the PDF
 * @returns The Y position after adding the section
 */
export const addExperienceSection = (doc: jsPDF, promotionNames: string[]): number => {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text("Professional Experience:", 40, 150);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const experienceText = promotionNames.join(", ");
  doc.text(doc.splitTextToSize(experienceText, 220), 40, 158);
  
  return 165; // Return the approximate Y position after this section
};

/**
 * Adds the skills section to the PDF
 * @returns The Y position after adding the section
 */
export const addSkillsSection = (doc: jsPDF, skillsGained: string[], startY: number): number => {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text("Professional Skills Demonstrated:", 40, startY + 10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const skillsText = skillsGained.join(", ");
  doc.text(doc.splitTextToSize(skillsText, 220), 40, startY + 18);
  
  return startY + 25; // Return the approximate Y position after this section
};

/**
 * Adds the shifts table to the PDF
 * @returns The Y position after adding the table
 */
export const addShiftsTable = async (
  doc: jsPDF, 
  shifts: { date: string; title: string; hours: number; location?: string }[],
  startY: number
): Promise<number> => {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 64, 255);
  doc.text("Work Record Summary:", 40, startY + 5);
  
  // Create table data
  const tableColumn = ["Date", "Assignment", "Location", "Hours"];
  const tableRows = shifts.map(shift => [
    shift.date,
    shift.title,
    shift.location || "Various Locations",
    shift.hours.toString()
  ]);
  
  // Add table with better styling
  doc.autoTable({
    startY: startY + 10,
    head: [tableColumn],
    body: tableRows,
    headStyles: {
      fillColor: [80, 80, 240],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 255]
    },
    theme: 'grid',
    styles: {
      fontSize: 9
    }
  });
  
  // Get final Y position after table
  return (doc as any).lastAutoTable.finalY + 5;
};
