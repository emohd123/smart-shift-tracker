import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, FileEdit } from "lucide-react";

export default function CompanyDashboard() {
  useEffect(() => {
    document.title = "Company Dashboard | SmartShift";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Company dashboard to manage shifts and company profile.");
  }, []);

  return (
    <AppLayout title="Company Dashboard">
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">Create a Shift</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Post a new shift and assign promoters.
              </p>
            </div>
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <Button asChild className="mt-4">
            <Link to="/shifts/create">
              Create Shift
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">Company Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your company information and logo.
              </p>
            </div>
            <FileEdit className="h-6 w-6 text-primary" />
          </div>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/company/profile">
              Edit Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </AppLayout>
  );
}
