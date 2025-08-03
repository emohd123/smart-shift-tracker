import TrainingModules from "@/components/training/TrainingModules";
import AppLayout from "@/components/layout/AppLayout";

export default function Training() {
  return (
    <AppLayout title="Training Modules">
      <div className="container mx-auto py-8 px-4">
        <TrainingModules />
      </div>
    </AppLayout>
  );
}