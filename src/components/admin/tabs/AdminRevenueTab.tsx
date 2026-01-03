import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RevenueAnalytics from "@/components/revenue/RevenueAnalytics";

export default function AdminRevenueTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>
            Track platform revenue from shifts and certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueAnalytics />
        </CardContent>
      </Card>
    </div>
  );
}
