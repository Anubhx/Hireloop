import { ReactNode } from "react";

type ScoreLevel = "high" | "mid" | "low";
type ConfidenceLevel = "high" | "mid";
type TagVariant = "default" | "match" | "gap";

interface ScorePillProps {
  score: number | string;
  level: ScoreLevel;
}

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  children: ReactNode;
}

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
}

const scoreStyles: Record<ScoreLevel, string> = {
  high: "bg-success-light text-success",
  mid: "bg-warning-light text-[#B45309]",
  low: "bg-danger-light text-danger",
};

const confidenceStyles: Record<ConfidenceLevel, string> = {
  high: "bg-success-light text-success",
  mid: "bg-warning-light text-[#B45309]",
};

const tagStyles: Record<TagVariant, string> = {
  default: "bg-surface-3 text-text-secondary border border-border-color",
  match: "bg-success-light text-success border-transparent",
  gap: "bg-danger-light text-danger border-transparent",
};

export function ScorePill({ score, level }: ScorePillProps) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-[3px] rounded-full whitespace-nowrap shrink-0 ${scoreStyles[level]}`}
    >
      {score}
    </span>
  );
}

export function ConfidenceBadge({ level, children }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-[3px] rounded-full ${confidenceStyles[level]}`}
    >
      {children}
    </span>
  );
}

export function Tag({ variant = "default", children }: TagProps) {
  return (
    <span
      className={`text-[10px] font-medium px-[7px] py-[2px] rounded-full ${tagStyles[variant]}`}
    >
      {children}
    </span>
  );
}

export function SkillChip({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-light text-accent border border-accent/20">
      {children}
    </span>
  );
}
