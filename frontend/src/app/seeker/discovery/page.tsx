"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState } from "@/components/EmptyState";
import { ScorePill, Tag } from "@/components/StatusBadges";
import { useUserStore } from "@/lib/store";
import { getJobs, generateCoverLetter, ScoredJob } from "@/lib/api";
import { Search, Loader2, FileText, CheckCircle } from "lucide-react";

export default function SeekerDiscovery() {
  const { userId } = useUserStore();
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ScoredJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs(userId);
      setJobs(data.scored_jobs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();

    // Poll every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleGenerateCoverLetter = async (job: ScoredJob) => {
    setIsGenerating(true);
    setError(null);

    try {
      await generateCoverLetter(userId, job.job_id);
      setGenerationSuccess(true);
      setTimeout(() => setGenerationSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate cover letter");
    } finally {
      setIsGenerating(false);
    }
  };

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
          <div className="px-5 py-4 border-b border-border-color bg-surface flex items-center justify-between">
            <div>
              <h1 className="font-display text-base font-bold text-text-primary tracking-tight">
                Job Discovery
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                {isLoading
                  ? "Searching for matches..."
                  : `${jobs.length} jobs found · sorted by fit`}
              </p>
            </div>
            <button
              onClick={fetchJobs}
              className="text-xs font-medium px-3 py-[6px] rounded-md border border-border-color text-text-secondary hover:bg-surface-3 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Refresh
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-3 mt-3 bg-danger-light rounded-md p-2.5">
              <div className="text-[11px] text-danger">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {generationSuccess && (
            <div className="mx-3 mt-3 bg-success-light rounded-md p-2.5">
              <div className="text-[11px] text-success flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Cover letter generated! Check the Activity Feed for progress.
              </div>
            </div>
          )}

          {/* Job List */}
          {isLoading && jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <div className="text-sm font-medium text-text-primary">
                Agent is searching for jobs
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                Scanning job boards for matches...
              </div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className={`bg-surface border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedJob?.job_id === job.job_id
                      ? "border-accent bg-accent-light"
                      : "border-border-color hover:border-accent"
                  }`}
                  onClick={() =>
                    setSelectedJob(selectedJob?.job_id === job.job_id ? null : job)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-text-primary font-display">
                        {job.title}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {job.company}
                      </div>
                      {job.description && (
                        <div className="text-[10px] text-text-muted mt-1 line-clamp-2">
                          {job.description}
                        </div>
                      )}
                    </div>
                    <ScorePill score={job.score} level={getScoreLevel(job.score)} />
                  </div>

                  {/* Skill Tags */}
                  {(job.matched_skills?.length > 0 || job.missing_skills?.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.matched_skills?.slice(0, 4).map((skill) => (
                        <Tag key={skill} variant="match">
                          ✓ {skill}
                        </Tag>
                      ))}
                      {job.missing_skills?.slice(0, 2).map((skill) => (
                        <Tag key={skill} variant="gap">
                          ✗ {skill}
                        </Tag>
                      ))}
                    </div>
                  )}

                  {/* Expanded: Generate Cover Letter */}
                  {selectedJob?.job_id === job.job_id && (
                    <div className="mt-3 pt-3 border-t border-border-color">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateCoverLetter(job);
                        }}
                        disabled={isGenerating}
                        className="w-full bg-accent text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generating cover letter...
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            Generate Cover Letter
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title="No jobs found yet"
              description="Upload your resume first, then the agent will start searching for matching roles."
            />
          )}
        </div>
      </div>
    </div>
  );
}
