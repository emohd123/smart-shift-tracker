import PaymentReceiptList from "@/components/payments/PaymentReceiptList";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { isCompanyLike } from "@/utils/roleUtils";

export default function PaymentReceipts() {
  const { userRole } = useAuth();
  const isCompany = isCompanyLike(userRole);
  const title = isCompany ? "Payment Receipts" : "My Payment Receipts";

  return (
    <AppLayout title={title}>
      <PaymentReceiptList />
    </AppLayout>
  );
}
