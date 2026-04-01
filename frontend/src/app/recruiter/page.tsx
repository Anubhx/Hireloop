import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ScorePill } from "@/components/StatusBadges";
import { BarChart3, Users, Award } from "lucide-react";

const stats = [
  { value: "47", label: "Applications", delta: "+12 today", deltaType: "up" as const },
  { value: "10", label: "Shortlisted", delta: null, deltaType: null },
  { value: "3", label: "Interviews", delta: null, deltaType: null },
  { value: "1", label: "Offer sent", delta: null, deltaType: null },
];

const funnelData = [
  { name: "Applied", count: 47, pct: 100, color: "bg-brand-200" },
  { name: "AI Screened", count: 47, pct: 100, color: "bg-brand-300" },
  { name: "Top 10", count: 10, pct: 21, color: "bg-accent" },
  { name: "Shortlisted", count: 6, pct: 13, color: "bg-success" },
  { name: "Interview", count: 3, pct: 6, color: "bg-warning" },
  { name: "Offer", count: 1, pct: 2, color: "bg-danger" },
];

const topCandidates = [
  { rank: 1, initials: "AR", name: "Anubhav Raj", role: "2.3 yrs · LangGraph, FastAPI, Next.js", score: 92, level: "high" as const },
  { rank: 2, initials: "PS", name: "Priya Sharma", role: "3.1 yrs · Python, TensorFlow, GCP", score: 84, level: "high" as const },
  { rank: 3, initials: "RK", name: "Rohit Kumar", role: "4 yrs · ML, Spark, Databricks", score: 71, level: "mid" as const },
];

export default function RecruiterDashboard() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="recruiter" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          {/* Stats Row — responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-color border-b border-border-color">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-surface p-4">
                <div className="font-display text-[22px] font-bold text-text-primary tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{stat.label}</div>
                {stat.delta && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-1 bg-success-light text-success">
                    {stat.delta}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="p-3">
            {/* Funnel */}
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              Funnel · AI Engineer
            </div>
            <div className="bg-surface border border-border-color rounded-lg p-4 mb-3">
              {funnelData.map((stage) => (
                <div
                  key={stage.name}
                  className="flex items-center gap-2.5 py-1.5 border-b border-border-color last:border-b-0"
                >
                  <span className="text-xs text-text-primary w-[90px]">{stage.name}</span>
                  <div className="flex-1 h-4 bg-surface-3 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${stage.color}`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-text-secondary w-6 text-right">
                    {stage.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Top Candidates */}
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              Top candidates
            </div>
            <div className="bg-surface border border-border-color rounded-lg overflow-hidden">
              {topCandidates.map((cand) => (
                <button
                  key={cand.name}
                  className="w-full px-4 py-2.5 border-b border-border-color last:border-b-0 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors text-left"
                >
                  <span
                    className={`text-[10px] font-bold w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${
                      cand.rank === 1
                        ? "bg-[#FEF3C7] text-[#92400E]"
                        : "bg-surface-3 text-text-secondary"
                    }`}
                  >
                    {cand.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-500 shrink-0">
                    {cand.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary">{cand.name}</div>
                    <div className="text-[11px] text-text-muted">{cand.role}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <ScorePill score={cand.score} level={cand.level} />
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Stats — responsive */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-surface border border-border-color rounded-lg p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted mb-1">
                  <BarChart3 className="w-3.5 h-3.5" /> Avg score
                </div>
                <div className="font-display text-lg font-bold">72</div>
              </div>
              <div className="bg-surface border border-border-color rounded-lg p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted mb-1">
                  <Users className="w-3.5 h-3.5" /> Screening Qs
                </div>
                <div className="font-display text-lg font-bold">30</div>
              </div>
              <div className="bg-surface border border-border-color rounded-lg p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted mb-1">
                  <Award className="w-3.5 h-3.5" /> Conversion
                </div>
                <div className="font-display text-lg font-bold">6.4%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
