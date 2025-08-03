import CreditSystem from "@/components/credits/CreditSystem";
import AppLayout from "@/components/layout/AppLayout";

export default function Credits() {
  return (
    <AppLayout title="Credits">
      <div className="container mx-auto py-8 px-4">
        <CreditSystem />
      </div>
    </AppLayout>
  );
}