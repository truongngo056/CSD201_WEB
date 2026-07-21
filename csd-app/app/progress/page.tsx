import { ProgressDashboard } from "@/components/progress/progress-dashboard";

export const metadata = {
  title: "Progress · CSD201 Lab",
  description: "Track your learning progress and achievements",
};

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <ProgressDashboard />
    </div>
  );
}
