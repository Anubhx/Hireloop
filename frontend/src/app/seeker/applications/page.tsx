import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";

export default function SeekerApplications() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="seeker" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color bg-surface flex items-center justify-between">
            <div>
              <h1 className="font-display text-base font-bold text-text-primary tracking-tight">
                My Applications
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Track your application status
              </p>
            </div>
          </div>

          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No applications yet"
            description="Once your agent applies to jobs, they'll appear here with live status tracking."
          />
        </div>
      </div>
    </div>
  );
}
