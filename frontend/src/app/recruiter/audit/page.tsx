import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState } from "@/components/EmptyState";
import { Shield } from "lucide-react";

export default function RecruiterAudit() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="recruiter" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color bg-surface flex items-center justify-between">
            <div>
              <h1 className="font-display text-base font-bold text-text-primary tracking-tight">
                Audit Trail
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                All AI and human actions logged
              </p>
            </div>
          </div>

          <EmptyState
            icon={<Shield className="w-6 h-6" />}
            title="No actions recorded yet"
            description="Agent decisions and human overrides will appear here with full traceability."
          />
        </div>
      </div>
    </div>
  );
}
