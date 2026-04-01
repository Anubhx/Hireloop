"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState } from "@/components/EmptyState";
import { useUserStore } from "@/lib/store";
import { createActivityFeed } from "@/lib/api";
import { Activity, Loader2 } from "lucide-react";

interface ActivityLog {
  action: string;
  result?: string;
  timestamp: string;
  id?: string;
}

export default function SeekerActivity() {
  const { userId } = useUserStore();
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setIsConnecting(true);

    const source = createActivityFeed(
      userId,
      (data) => {
        setIsConnected(true);
        setIsConnecting(false);

        const log: ActivityLog = typeof data === "object" && data !== null
          ? {
              action: (data as Record<string, unknown>).action as string || "Unknown action",
              result: (data as Record<string, unknown>).result as string | undefined,
              timestamp: (data as Record<string, unknown>).timestamp as string || new Date().toISOString(),
              id: (data as Record<string, unknown>).id as string,
            }
          : {
              action: String(data),
              timestamp: new Date().toISOString(),
            };

        setActivityFeed((prev) => [log, ...prev]);
      },
      () => {
        setError("Connection lost. Retrying...");
        setIsConnected(false);
      }
    );

    feedRef.current = source;

    // Mark as connected after timeout if no data arrives
    const timeout = setTimeout(() => {
      setIsConnecting(false);
    }, 3000);

    return () => {
      source.close();
      clearTimeout(timeout);
    };
  }, [userId]);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timestamp;
    }
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
                Agent Activity
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Live feed of what your agent is doing
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConnecting && (
                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
              )}
              <span
                className={`flex items-center gap-1.5 text-[11px] ${
                  isConnected ? "text-success" : "text-text-muted"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? "bg-success animate-pulse-dot" : "bg-text-muted"
                  }`}
                />
                {isConnected ? "Live" : isConnecting ? "Connecting..." : "Idle"}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-3 mt-3 bg-danger-light rounded-md p-2.5">
              <div className="text-[11px] text-danger">{error}</div>
            </div>
          )}

          {/* Activity Feed */}
          {activityFeed.length > 0 ? (
            <div className="p-3 space-y-0">
              {activityFeed.map((log, index) => (
                <div key={log.id || index} className="flex gap-2.5 items-start py-2">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        index === 0 ? "bg-accent animate-pulse-dot" : "bg-success"
                      }`}
                    />
                    {index < activityFeed.length - 1 && (
                      <div className="w-px h-full bg-border-color min-h-[20px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <div className="text-[12px] font-medium text-text-primary">
                      {log.action}
                    </div>
                    {log.result && (
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {log.result}
                      </div>
                    )}
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="w-6 h-6" />}
              title="Waiting for agent activity"
              description="Upload your resume to start. The agent will begin searching and its actions will stream here."
            />
          )}
        </div>
      </div>
    </div>
  );
}
