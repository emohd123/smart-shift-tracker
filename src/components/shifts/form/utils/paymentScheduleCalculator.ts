export interface PaymentScheduleItem {
  date: Date;
  promoterId: string;
  promoterName: string;
  grossAmount: number;
  deductions: {
    tax?: number;
    platformFee?: number;
    other?: number;
  };
  netAmount: number;
  status: "scheduled" | "pending" | "paid";
  daysUntilPayment: number;
}

export interface PaymentScheduleInput {
  shiftStartDate: Date;
  shiftEndDate: Date;
  paymentDate: Date;
  assignedPromoters: Array<{
    id: string;
    workHours: number;
    estimatedPay: number;
  }>;
  payRate: number;
  payRateType: "hourly" | "daily" | "fixed";
}

export function calculatePaymentSchedule(input: PaymentScheduleInput): PaymentScheduleItem[] {
  const {
    shiftStartDate,
    shiftEndDate,
    paymentDate,
    assignedPromoters,
    payRate,
    payRateType
  } = input;

  const daysUntilPayment = Math.ceil(
    (paymentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return assignedPromoters.map(promoter => {
    const grossAmount = promoter.estimatedPay;
    
    // No deductions - promoters receive 100%
    const deductions = {
      tax: 0,
      platformFee: 0
    };

    const netAmount = grossAmount;

    return {
      date: paymentDate,
      promoterId: promoter.id,
      promoterName: `Promoter ${promoter.id.slice(0, 8)}`, // Will be replaced with actual name
      grossAmount,
      deductions,
      netAmount,
      status: "scheduled" as const,
      daysUntilPayment
    };
  });
}

export function formatCurrency(amount: number, currency: string = "BHD"): string {
  const formatter = new Intl.NumberFormat("en-BH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 3
  });
  return formatter.format(amount);
}

export function calculateWorkHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60; // Handle overnight shifts
  
  return diff / 60;
}

export function calculateDailyPay(hourlyRate: number, workHours: number): number {
  return parseFloat((hourlyRate * workHours).toFixed(2));
}
