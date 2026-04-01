import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function RecruiterPost() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="recruiter" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color bg-surface flex items-center justify-between">
            <div>
              <h1 className="font-display text-base font-bold text-text-primary tracking-tight">
                Post a Job
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Create a new role for your agent to source
              </p>
            </div>
            <button className="text-xs font-medium px-3 py-[6px] rounded-md bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer">
              Publish →
            </button>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Job Title
              </label>
              <input
                type="text"
                className="w-full border border-border-color rounded-md px-2.5 py-[7px] text-xs text-text-primary bg-surface focus:outline-none focus:border-accent"
                placeholder="e.g. AI Engineer"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Company
              </label>
              <input
                type="text"
                className="w-full border border-border-color rounded-md px-2.5 py-[7px] text-xs text-text-primary bg-surface focus:outline-none focus:border-accent"
                placeholder="e.g. Bhanzu"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Job Description
              </label>
              <textarea
                className="w-full border border-border-color rounded-md px-2.5 py-2.5 text-xs text-text-primary bg-surface focus:outline-none focus:border-accent resize-none min-h-[120px]"
                placeholder="Describe the role, requirements, and responsibilities..."
              />
            </div>

            <div className="bg-success-light rounded-md p-3">
              <div className="text-[11px] font-semibold text-success mb-1">
                ✓ Agent will parse requirements
              </div>
              <p className="text-[11px] text-text-muted">
                Skills, nice-to-haves, and seniority level will be extracted automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
