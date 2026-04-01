import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ScorePill } from "@/components/StatusBadges";

interface KanbanCard {
  name: string;
  role: string;
  score?: number;
  level?: "high" | "mid" | "low";
  date: string;
  highlight?: boolean;
}

interface KanbanColumn {
  title: string;
  count: number;
  cards: KanbanCard[];
}

const kanbanColumns: KanbanColumn[] = [
  {
    title: "Applied",
    count: 47,
    cards: [
      { name: "Anubhav Raj", role: "AI Engineer", score: 92, level: "high", date: "Today" },
      { name: "Priya Sharma", role: "ML Engineer", score: 84, level: "high", date: "Today" },
      { name: "Rohit Kumar", role: "Full Stack", score: 71, level: "mid", date: "Yesterday" },
      { name: "Meera Varma", role: "Frontend Dev", score: 44, level: "low", date: "2 days ago" },
    ],
  },
  {
    title: "Screening",
    count: 12,
    cards: [
      { name: "Vikram Singh", role: "Backend Dev", score: 78, level: "high", date: "Today", highlight: true },
      { name: "Nisha Patel", role: "Data Eng", score: 65, level: "mid", date: "Yesterday" },
    ],
  },
  {
    title: "Shortlisted",
    count: 6,
    cards: [
      { name: "Anubhav Raj", role: "AI Engineer", score: 92, level: "high", date: "Today" },
      { name: "Priya Sharma", role: "ML Engineer", score: 84, level: "high", date: "Today" },
    ],
  },
  {
    title: "Interview",
    count: 3,
    cards: [
      { name: "Arjun Mehta", role: "AI Sciences SE", score: 88, level: "high", date: "Round 2 ✓", highlight: true },
    ],
  },
  {
    title: "Offer",
    count: 1,
    cards: [
      { name: "Kavya Nair", role: "Senior AI Eng", score: 95, level: "high", date: "Sent" },
    ],
  },
];

const funnelData = [
  { name: "Applied", count: 47, pct: 100, color: "bg-brand-200" },
  { name: "AI Screened", count: 47, pct: 100, color: "bg-brand-300" },
  { name: "Shortlisted", count: 6, pct: 13, color: "bg-success" },
  { name: "Interview", count: 3, pct: 6, color: "bg-warning" },
  { name: "Offer", count: 1, pct: 2, color: "bg-danger" },
];

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="recruiter" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          {/* Page Header */}
          <div className="px-5 py-4 border-b border-border-color bg-surface flex items-center justify-between">
            <div>
              <h1 className="font-display text-base font-bold text-text-primary tracking-tight">
                Pipeline
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                AI Engineer · Bhanzu — Kanban view
              </p>
            </div>
            <button className="text-xs font-medium px-3 py-[6px] rounded-md border border-border-color text-text-secondary hover:bg-surface-3 transition-colors cursor-pointer">
              Filter
            </button>
          </div>

          {/* Kanban Board */}
          <div className="p-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {kanbanColumns.map((col) => (
                <div key={col.title} className="min-w-[180px] w-[180px] shrink-0">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-0.5 pb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      {col.title}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-3 text-text-muted">
                      {col.count}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-1.5">
                    {col.cards.map((card) => (
                      <div
                        key={card.name + col.title}
                        className={`bg-surface border border-border-color rounded-md p-2.5 cursor-pointer hover:border-accent transition-colors ${
                          card.highlight ? "border-amber bg-amber-light" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-text-primary truncate">
                              {card.name}
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5">{card.role}</div>
                          </div>
                          {card.score && card.level && (
                            <ScorePill score={card.score} level={card.level} />
                          )}
                        </div>
                        <div className="text-[10px] text-text-muted mt-1.5">{card.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel Summary below Kanban */}
          <div className="px-3 pb-3">
            <div className="bg-surface border border-border-color rounded-lg p-4 shadow-card">
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-3">
                Funnel Summary
              </div>
              <div className="space-y-2">
                {funnelData.map((stage, i) => (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-xs text-text-primary w-24">{stage.name}</span>
                    <div className="flex-1 h-3 bg-surface-3 rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm ${stage.color}`}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-text-secondary w-6 text-right">
                      {stage.count}
                    </span>
                    {i > 0 && (
                      <span className="text-[10px] text-text-muted w-10 text-right">
                        {Math.round((stage.count / funnelData[i - 1].count) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border-color grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="font-display text-xl font-bold text-text-primary">47</div>
                  <div className="text-[10px] text-text-muted">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-xl font-bold text-accent">21%</div>
                  <div className="text-[10px] text-text-muted">To Shortlist</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-xl font-bold text-success">6.4%</div>
                  <div className="text-[10px] text-text-muted">To Offer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
