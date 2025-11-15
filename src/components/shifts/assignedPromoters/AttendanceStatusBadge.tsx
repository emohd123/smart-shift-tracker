
import { Badge } from "@/components/ui/badge";
import { TimeLog } from "../utils/paymentCalculations";

type AttendanceStatusBadgeProps = {
  timeLogs: TimeLog[];
};

export const AttendanceStatusBadge = ({ timeLogs }: AttendanceStatusBadgeProps) => {
  if (!timeLogs || timeLogs.length === 0) {
    return (
      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
        Pending
      </Badge>
    );
  }

  const latestLog = timeLogs[timeLogs.length - 1];

  if (latestLog.check_out_time) {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
        ✓ Checked Out
      </Badge>
    );
  }

  if (latestLog.check_in_time) {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
        🟢 Checked In
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
      Pending
    </Badge>
  );
};
