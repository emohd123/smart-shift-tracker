
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { PromotersList } from "@/components/promoters/PromotersList";
import { Navigate } from "react-router-dom";
import { UserRole } from "@/types/database";

const Promoters = () => {
  const { user, isAuthenticated } = useAuth();

  // Only admins should access this page
  if (!isAuthenticated || user?.role !== UserRole.Admin) {
    return <Navigate to="/shifts" replace />;
  }

  return (
    <AppLayout title="Promoter Management">
      <PromotersList />
    </AppLayout>
  );
};

export default Promoters;
