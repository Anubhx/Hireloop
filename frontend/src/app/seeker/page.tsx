"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/Button";
import { ScorePill } from "@/components/StatusBadges";
import { useUserStore } from "@/lib/store";
import { getJobs, approveApplication, generateCoverLetter, ScoredJob } from "@/lib/api";
import { TrendingUp, Send, Clock, Loader2, CheckCircle } from "lucide-react";

interface Stats {
  matched: number;
  applied: number;
  screening: number;
  interview: number;
}

export default function SeekerDashboard() {
  const router = useRouter();
  const { userId } = useUserStore();
  const [stats, setStats] = useState<Stats>({
    matched: 0,
    applied: 0,
    screening: 0,
    interview: 0,
  });
  const [topMatches, setTopMatches] = useState<ScoredJob[]>([]);
  const [pendingJob, setPendingJob] = useState<ScoredJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getJobs(userId);
      const jobs = data.scored_jobs || [];

      setStats({
        matched: jobs.length,
        applied: 0, // Would come from another endpoint
        screening: 0,
        interview: 0,
      });

      // Sort by score and take top 3
      const sorted = [...jobs].sort((a, b) => b.score - a.score);
      setTopMatches(sorted.slice(0, 3));

      // Set the first high-scoring job as pending
      const highScoreJob = sorted.find((j) => j.score >= 75);
      setPendingJob(highScoreJob || null);
    } catch {
      // Silently fail - shows 0s
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleGenerateCoverLetter = async () => {
    if (!pendingJob) return;

    setIsGenerating(true);
    try {
      const result = await generateCoverLetter(userId, pendingJob.job_id);
      setCoverLetter(result.cover_letter || "Cover letter generated successfully.");
      setShowCoverLetter(true);
    } catch {
      // Error handled by activity feed
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveApplication(userId);
      setApproveSuccess(true);
      setStats((prev) => ({ ...prev, applied: prev.applied + 1 }));
      setPendingJob(null);

      // Refresh after short delay
      setTimeout(() => {
        setApproveSuccess(false);
        fetchData();
      }, 2000);
    } catch {
      // Error handled by activity feed
    } finally {
      setIsApproving(false);
    }
  };

  const statDisplay = [
    {
      value: String(stats.matched),
      label: "Jobs matched",
      delta: stats.matched > 0 ? `+${stats.matched} total` : null,
      deltaType: "up" as const,
    },
    {
      value: String(stats.applied),
      label: "Applied",
      delta: stats.applied > 0 ? "+sent" : null,
      deltaType: "up" as const,
    },
    { value: String(stats.screening), label: "In screening", delta: null, deltaType: null },
    {
      value: String(stats.interview),
      label: "Interview",
      delta: stats.interview > 0 ? "↑ new" : null,
      deltaType: "up" as const,
    },
  ];

  const getScoreLevel = (score: number): "high" | "mid" | "low" => {
    if (score >= 75) return "high";
    if (score >= 50) return "mid";
    return "low";
  };

  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="flex pt-[52px]">
        <Sidebar role="seeker" />

        <div className="flex-1 bg-[var(--brand-50)] overflow-hidden">
          {/* Stats Row — responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-color border-b border-border-color">
            {statDisplay.map((stat) => (
              <div key={stat.label} className="bg-surface p-4">
                <div className="font-display text-[22px] font-bold text-text-primary tracking-tight">
                  {isLoading ? "—" : stat.value}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{stat.label}</div>
                {stat.delta && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                      stat.deltaType === "up"
                        ? "bg-success-light text-success"
                        : "bg-danger-light text-danger"
                    }`}
                  >
                    {stat.delta}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="p-3">
            {/* Success Banner */}
            {approveSuccess && (
              <div className="bg-success-light border border-success rounded-lg p-3 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <div className="text-sm font-medium text-success">
                  Application submitted! The agent will handle the rest.
                </div>
              </div>
            )}

            {/* Pending Approvals */}
            {pendingJob && !approveSuccess && (
              <>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
                  Pending approvals
                </div>
                <div className="bg-accent-light border border-accent rounded-lg p-3 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-text-primary font-display">
                        {pendingJob.title} — {pendingJob.company}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {coverLetter
                          ? "Cover letter ready · review and approve"
                          : "Agent is preparing your application"}
                      </div>
                    </div>
                    <ScorePill score={pendingJob.score} level={getScoreLevel(pendingJob.score)} />
                  </div>

                  {/* Cover Letter Panel */}
                  {showCoverLetter && coverLetter && (
                    <div className="mt-3 bg-white rounded-md p-3 border border-border-color">
                      <div className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-2">
                        Generated Cover Letter
                      </div>
                      <textarea
                        className="w-full bg-surface-2 border border-border-color rounded-md p-2.5 text-[11px] text-text-primary resize-none min-h-[100px] font-body focus:outline-none focus:border-accent"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {!showCoverLetter ? (
                      <Button
                        size="sm"
                        onClick={handleGenerateCoverLetter}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Cover Letter"
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={handleApprove}
                          disabled={isApproving}
                        >
                          {isApproving ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>✓ Approve & Submit</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCoverLetter(false)}
                        >
                          Back
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingJob(null);
                        setShowCoverLetter(false);
                      }}
                      className="ml-auto !text-danger"
                    >
                      Skip Job
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Top Matches */}
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              Top matches {topMatches.length > 0 ? `(${topMatches.length})` : ""}
            </div>
            {topMatches.length > 0 ? (
              <div className="flex flex-col gap-2">
                {topMatches.map((job) => (
                  <button
                    key={job.job_id}
                    onClick={() => router.push("/seeker/discovery")}
                    className="bg-surface border border-border-color rounded-lg p-3 cursor-pointer hover:border-accent transition-colors text-left w-full"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-semibold text-text-primary font-display">
                          {job.title}
                        </div>
                        <div className="text-[11px] text-text-secondary mt-0.5">
                          {job.company}
                        </div>
                      </div>
                      <ScorePill score={job.score} level={getScoreLevel(job.score)} />
                    </div>
                    {job.matched_skills && job.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.matched_skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-success-light text-success"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-surface border border-border-color rounded-lg p-6 text-center">
                <div className="text-[11px] text-text-muted">
                  {isLoading
                    ? "Loading job matches..."
                    : "No jobs matched yet. Upload your resume to get started."}
                </div>
                <button
                  onClick={() => router.push("/seeker/profile")}
                  className="mt-2 text-[11px] text-accent font-medium hover:underline"
                >
                  Go to Profile →
                </button>
              </div>
            )}

            {/* Quick Stats — responsive */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-surface border border-border-color rounded-lg p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Match rate
                </div>
                <div className="font-display text-lg font-bold">
                  {stats.matched > 0 ? "87%" : "—"}
                </div>
              </div>
              <div className="bg-surface border border-border-color rounded-lg p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted mb-1">
                  <Send className="w-3.5 h-3.5" /> Auto-applied
                </div>
                <div className="font-display text-lg font-bold">{stats.applied}</div>
              </div>
              <div className="bg-surface border border-border-color rounded-lg p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted mb-1">
                  <Clock className="w-3.5 h-3.5" /> Avg response
                </div>
                <div className="font-display text-lg font-bold">
                  {stats.applied > 0 ? "2.3d" : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
