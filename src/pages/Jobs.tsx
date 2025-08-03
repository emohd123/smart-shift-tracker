import JobBoard from "@/components/jobs/JobBoard";
import AppLayout from "@/components/layout/AppLayout";

export default function Jobs() {
  return (
    <AppLayout title="Job Board">
      <div className="container mx-auto py-8 px-4">
        <JobBoard />
      </div>
    </AppLayout>
  );
}