
export interface TimeLog {
  id?: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  earnings: number | null;
}

export const calculateWorkDuration = (checkInTime: string, checkOutTime: string | null): number => {
  if (!checkOutTime) return 0;
  
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  return Math.max(0, hours);
};

export const formatWorkDuration = (hours: number): string => {
  const safeHours = typeof hours === 'number' && !isNaN(hours) ? hours : 0;
  const h = Math.floor(safeHours);
  const m = Math.floor((safeHours - h) * 60);
  return `${h}h ${m}m`;
};

export const calculatePromoterPayment = (
  timeLogs: TimeLog[],
  payRate: number,
  payRateType: string = 'hourly'
): number => {
  const totalHours = timeLogs.reduce((sum, log) => {
    return sum + (log.total_hours || 0);
  }, 0);

  switch (payRateType) {
    case 'hourly':
      return totalHours * payRate;
    case 'daily':
      // Assuming 8-hour workday
      return (totalHours / 8) * payRate;
    case 'monthly':
      // Assuming 160-hour month (4 weeks × 40 hours)
      return (totalHours / 160) * payRate;
    case 'fixed':
      return payRate;
    default:
      return totalHours * payRate;
  }
};

export const calculateTotalShiftPayment = (
  allTimeLogs: { [promoterId: string]: TimeLog[] },
  payRate: number,
  payRateType: string = 'hourly'
): number => {
  return Object.values(allTimeLogs).reduce((total, logs) => {
    return total + calculatePromoterPayment(logs, payRate, payRateType);
  }, 0);
};

export const formatBHD = (amount: number): string => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `BHD ${safeAmount.toFixed(3)}`;
};

export const calculateLiveEarnings = (
  checkInTime: string,
  payRate: number,
  payRateType: string
): { elapsedHours: number; currentEarnings: number } => {
  if (!checkInTime) {
    return { elapsedHours: 0, currentEarnings: 0 };
  }
  
  const safePayRate = typeof payRate === 'number' && !isNaN(payRate) ? payRate : 0;
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const elapsedMs = now.getTime() - checkIn.getTime();
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));

  let earnings = 0;

  switch (payRateType) {
    case 'hourly':
      earnings = elapsedHours * safePayRate;
      break;
    case 'daily':
      // Assuming 8-hour day
      earnings = (elapsedHours / 8) * safePayRate;
      break;
    case 'monthly':
      // Assuming 160-hour month
      earnings = (elapsedHours / 160) * safePayRate;
      break;
    case 'fixed':
      earnings = safePayRate;
      break;
    default:
      earnings = elapsedHours * safePayRate;
  }

  return { elapsedHours, currentEarnings: Math.max(0, earnings) };
};

/**
 * Calculate payment from time logs with detailed breakdown
 * @param timeLogs - Array of time log entries
 * @param payRate - Payment rate per unit
 * @param payRateType - Type of pay rate (hourly, daily, monthly, fixed)
 * @returns Object with total hours, amount, and breakdown by date
 */
export const calculatePaymentFromTimeLogs = (
  timeLogs: TimeLog[],
  payRate: number,
  payRateType: string = 'hourly'
): {
  totalHours: number;
  amount: number;
  breakdown: Array<{ date: string; hours: number; amount: number }>;
} => {
  // Filter only completed time logs
  const completedLogs = timeLogs.filter(log => log.check_out_time !== null);
  
  // Calculate total hours
  const totalHours = completedLogs.reduce((sum, log) => {
    return sum + (log.total_hours || 0);
  }, 0);

  // Group by date for breakdown
  const breakdownMap = new Map<string, { hours: number; amount: number }>();
  
  completedLogs.forEach(log => {
    if (!log.check_in_time) return;
    
    const date = new Date(log.check_in_time).toISOString().split('T')[0];
    const hours = log.total_hours || 0;
    
    const existing = breakdownMap.get(date) || { hours: 0, amount: 0 };
    existing.hours += hours;
    
    // Calculate amount for this day based on pay rate type
    let dayAmount = 0;
    switch (payRateType) {
      case 'hourly':
        dayAmount = hours * payRate;
        break;
      case 'daily':
        dayAmount = (hours / 8) * payRate;
        break;
      case 'monthly':
        dayAmount = (hours / 160) * payRate;
        break;
      case 'fixed':
        dayAmount = payRate;
        break;
      default:
        dayAmount = hours * payRate;
    }
    
    existing.amount += dayAmount;
    breakdownMap.set(date, existing);
  });

  // Convert map to array
  const breakdown = Array.from(breakdownMap.entries()).map(([date, data]) => ({
    date,
    hours: data.hours,
    amount: data.amount
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate total amount
  const amount = calculatePromoterPayment(completedLogs, payRate, payRateType);

  return {
    totalHours,
    amount,
    breakdown
  };
};