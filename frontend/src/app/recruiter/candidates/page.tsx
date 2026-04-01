import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState } from "@/components/EmptyState";
import { Users } from "lucide-react";

export default function RecruiterCandidates() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="recruiter" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color bg-surface flex items-center justify-between">
            <div>
              <h1 className="font-display text-base font-bold text-text-primary tracking-tight">
                Candidates
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                AI-screened and ranked applicants
              </p>
            </div>
            <button className="text-xs font-medium px-3 py-[6px] rounded-md border border-border-color text-text-secondary hover:bg-surface-3 transition-colors cursor-pointer">
              Filter
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border-color px-3 bg-surface">
            <button className="text-xs font-medium py-2.5 px-3 text-accent border-b-2 border-accent -mb-px cursor-pointer">
              Top 10
            </button>
            <button className="text-xs font-medium py-2.5 px-3 text-text-muted border-b-2 border-transparent -mb-px hover:text-text-secondary transition-colors cursor-pointer">
              All
            </button>
            <button className="text-xs font-medium py-2.5 px-3 text-text-muted border-b-2 border-transparent -mb-px hover:text-text-secondary transition-colors cursor-pointer">
              Shortlisted
            </button>
          </div>

          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No candidates have applied yet"
            description="Post a job to start receiving applications. The agent will screen and rank candidates automatically."
          />
        </div>
      </div>
    </div>
  );
}
