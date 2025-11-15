import { Card, CardContent } from "@/components/ui/card";
import RevenueAnalytics from "@/components/revenue/RevenueAnalytics";
import AppLayout from "@/components/layout/AppLayout";

export default function RevenuePage() {
  return (
    <AppLayout title="Revenue Analytics">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold">Revenue Analytics</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor platform revenue and engagement metrics
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <RevenueAnalytics />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
