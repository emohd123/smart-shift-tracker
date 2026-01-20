/**
 * Centralized tooltip content configuration
 * Used across company and part-timer pages for consistent help text
 */

export const tooltips = {
  company: {
    dashboard: {
      liveOperations: "Real-time view of your active shifts and current operations",
      activeShifts: "Number of shifts currently in progress",
      activePromoters: "Total number of promoters currently working on active shifts",
      totalHours: "Combined hours being worked across all active shifts",
      liveEarnings: "Total earnings being generated from active shifts in real-time",
      activeShiftsHeader: "Shifts that are currently ongoing with promoters checked in",
      viewAllShifts: "Navigate to the full shifts list to see all shifts",
      createNewShift: "Create a new shift assignment for promoters",
    },
    shifts: {
      title: "A descriptive name for this shift (e.g., 'Mall Promotion - Electronics Section')",
      location: "Physical address or location where the shift takes place. GPS verification will use this location.",
      dateRange: "Select the start and end dates for this shift. Can span multiple days.",
      startTime: "The time when promoters should check in and start working",
      endTime: "The time when promoters should check out and finish working",
      payRate: "Hourly or fixed payment amount for this shift. Promoters will earn this amount per hour worked.",
      payRateType: "Choose between hourly rate (paid per hour) or fixed rate (one-time payment for the shift)",
      promoterSelection: "Select promoters to assign to this shift. They will receive notifications.",
      contractTerms: "Additional terms and conditions specific to this shift",
      status: "Current status of the shift: Draft, Published, Ongoing, Completed, or Cancelled",
      assignedPromoters: "Promoters who have been assigned to work this shift",
      paymentSummary: "Total payment calculation based on hours worked and pay rate",
      approveWork: "Approve the completed work and authorize payment",
      rejectWork: "Reject the work submission if it doesn't meet requirements",
      filterOptions: "Filter shifts by status, date range, or other criteria",
      sortOptions: "Sort shifts by date, status, or other attributes",
      list: {
        search: "Search shifts by title, location, date, or company name",
        sortBy: "Sort shifts by date (newest/oldest), status, company, or title",
        statusFilter: "Filter shifts by status: All, Current (ongoing), Completed, or Upcoming",
        companyFilter: "Filter shifts by company (admin only)",
        statusBadge: "Current status of the shift: Ongoing (in progress), Completed (finished), Upcoming (scheduled), or Draft (not published)",
        bulkActions: "Select multiple shifts to perform bulk operations like updating pay rates or deleting",
        refresh: "Refresh the shifts list to get the latest data",
      },
    },
    profile: {
      companyName: "Your registered company name as it appears on official documents",
      website: "Your company's website URL (optional)",
      registrationId: "Your company's registration or tax identification number",
      address: "Physical address of your company",
      contactInfo: "Contact information for your company",
      documentUpload: "Upload company documents such as CR certificate, business license, etc.",
    },
    reports: {
      reportType: "Select the type of report you want to generate: Shifts, Promoters, Revenue, or Ratings",
      dateRange: "Filter report data by selecting a date range (7 days, 30 days, 90 days, or custom)",
      exportOptions: "Export the report in various formats (PDF, Excel, CSV) for external use",
      statistics: "View key metrics and statistics for your shifts and promoters",
      chartType: "Choose how to visualize the data: Line chart, Bar chart, Pie chart, or Area chart",
      filters: "Apply additional filters to narrow down the report data",
      metrics: "Key performance indicators and statistics for your business",
    },
    payments: {
      paymentStatus: "Current status of the payment: Pending (awaiting payment), Paid (completed), or Failed (error occurred)",
      amount: "Total payment amount for the shift or period",
      receiptGeneration: "Generate and download payment receipts for records",
      dateFilter: "Filter receipts by date range to find specific payment records",
      search: "Search receipts by receipt number, shift title, or company/promoter name",
      download: "Download individual receipts in PDF format",
      receiptViewer: "View detailed receipt information including payment breakdown and shift details",
    },
    promoters: {
      search: "Search promoters by name, unique code, email, or phone number",
      statusFilter: "Filter promoters by verification status: Approved, Pending, or Rejected",
      rating: "Promoter's average rating based on company feedback",
      verificationStatus: "Current verification status: Approved (verified), Pending (under review), or Rejected",
      assignShift: "Assign this promoter to a shift",
      viewProfile: "View detailed promoter profile and work history",
      bulkActions: "Select multiple promoters to perform bulk operations",
    },
    messages: {
      filters: "Filter messages by status, date, or sender",
      conversation: "View message thread with a specific user",
      sendMessage: "Send a new message or reply to an existing conversation",
      attachments: "Attach files or documents to your message",
      status: "Message status: Unread (new), Read (viewed), or Archived",
    },
    revenue: {
      dateRange: "Select date range to view revenue for specific periods",
      chartType: "Choose visualization: Line chart (trends), Bar chart (comparison), or Pie chart (breakdown)",
      export: "Export revenue data to PDF, Excel, or CSV format",
      statistics: "Revenue metrics including total earnings, growth rate, and projections",
      filters: "Filter revenue by shift type, company, or promoter",
    },
    admin: {
      overview: "Dashboard overview showing key metrics and statistics",
      users: "User management: View, edit, and manage all users (promoters, companies, admins)",
      shifts: "Shift management: View all shifts across all companies",
      revenue: "Revenue analytics and financial reports",
      reports: "Generate and view detailed reports",
      system: "System settings and configuration options",
    },
    settings: {
      passwordChange: "Change your account password for security",
      notifications: "Configure email and in-app notification preferences",
      privacy: "Manage privacy settings and data visibility",
      account: "Update account information and preferences",
    },
    dataPurge: {
      purgeOptions: "Select what type of data to permanently delete",
      dataTypes: "Choose specific data types: Shifts, Users, Time Logs, Payments, etc.",
      warnings: "Warning: Data purge is permanent and cannot be undone",
      confirmation: "Confirm the purge operation to proceed with data deletion",
    },
  },
  partTimer: {
    dashboard: {
      upcomingShifts: "Shifts that are scheduled but haven't started yet",
      activeShifts: "Shifts you're currently working on (checked in)",
      earningsSummary: "Total earnings from completed shifts",
      quickActions: "Quick access to common actions like checking in/out",
    },
    timeTracking: {
      checkIn: "Start tracking your work time for this shift. Your location will be verified.",
      checkOut: "End your work session and calculate total hours worked",
      activeShift: "Information about the shift you're currently working on",
      elapsedTime: "Total time you've been working on this shift",
      locationVerification: "GPS-based location verification to ensure you're at the correct shift location",
      breakTime: "Record break periods during your shift (optional)",
    },
    timeHistory: {
      dateFilter: "Filter your time logs by date range to view specific periods",
      shiftStatus: "Status of each shift: Completed (finished), Ongoing (in progress), or Cancelled",
      hoursWorked: "Total hours worked for each shift, calculated from check-in to check-out time",
      earnings: "Earnings calculated based on hours worked and the shift's pay rate",
      timeLog: "Individual time tracking entry showing check-in and check-out times",
      export: "Export your time history data to CSV or PDF format",
    },
    certificates: {
      generation: "Generate professional work certificates for completed shifts",
      paymentStatus: "Payment status for certificate generation (if applicable)",
      download: "Download your generated certificates in PDF format",
      verification: "Certificate verification status and unique verification code",
    },
    profile: {
      fullName: "Your full legal name as it appears on official documents",
      nationality: "Your nationality or country of origin",
      age: "Your current age",
      phoneNumber: "Your contact phone number",
      email: "Your email address for notifications and account recovery",
      bankDetails: "Bank account information for receiving payments",
      verificationStatus: "Current status of your profile verification",
      documentUpload: "Upload required documents such as ID card, bank statement, etc.",
    },
    contracts: {
      contractStatus: "Status of your contract: Pending, Accepted, or Rejected",
      terms: "Terms and conditions of the shift contract",
      acceptance: "Accept or reject the contract terms before starting work",
    },
  },
  shared: {
    status: {
      draft: "Shift is saved but not yet published to promoters",
      published: "Shift is available for promoters to see and apply",
      ongoing: "Shift is currently in progress",
      completed: "Shift has been completed",
      cancelled: "Shift was cancelled and will not proceed",
    },
    actions: {
      edit: "Edit the details of this item",
      delete: "Permanently delete this item",
      view: "View detailed information",
      save: "Save your changes",
      cancel: "Cancel and discard changes",
    },
  },
};

/**
 * Helper function to get tooltip content by path
 * Example: getTooltip('company.shifts.title')
 */
export function getTooltip(path: string): string {
  const keys = path.split('.');
  let current: any = tooltips;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return '';
    }
  }
  
  return typeof current === 'string' ? current : '';
}
