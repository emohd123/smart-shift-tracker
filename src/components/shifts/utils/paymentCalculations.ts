
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
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
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
  return `BHD ${amount.toFixed(3)}`;
};

export const calculateLiveEarnings = (
  checkInTime: string,
  payRate: number,
  payRateType: string
): { elapsedHours: number; currentEarnings: number } => {
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const elapsedMs = now.getTime() - checkIn.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  let earnings = 0;

  switch (payRateType) {
    case 'hourly':
      earnings = elapsedHours * payRate;
      break;
    case 'daily':
      // Assuming 8-hour day
      earnings = (elapsedHours / 8) * payRate;
      break;
    case 'monthly':
      // Assuming 160-hour month
      earnings = (elapsedHours / 160) * payRate;
      break;
    case 'fixed':
      earnings = payRate;
      break;
    default:
      earnings = elapsedHours * payRate;
  }

  return { elapsedHours, currentEarnings: Math.max(0, earnings) };
};
