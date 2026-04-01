const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions {
  method?: string;
  body?: BodyInit | Record<string, unknown>;
  headers?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  if (body && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    config.body = body;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

// Resume upload with FormData
export async function uploadResume(
  userId: string,
  file: File
): Promise<{ message: string; skills: string[]; experience: string }> {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("file", file);

  return apiClient("/api/seeker/upload-resume", {
    method: "POST",
    body: formData,
  });
}

// Get scored jobs
export interface ScoredJob {
  job_id: string;
  title: string;
  company: string;
  description: string;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
}

export interface JobsResponse {
  scored_jobs: ScoredJob[];
  raw_jobs: ScoredJob[];
}

export async function getJobs(userId: string): Promise<JobsResponse> {
  return apiClient(`/api/seeker/jobs/${userId}`);
}

// Generate cover letter
export async function generateCoverLetter(
  userId: string,
  jobId: string
): Promise<{ message: string; cover_letter?: string }> {
  return apiClient("/api/seeker/generate-cover-letter", {
    method: "POST",
    body: { user_id: userId, job_id: jobId },
  });
}

// Approve application
export async function approveApplication(
  userId: string
): Promise<{ message: string; status: string }> {
  return apiClient("/api/seeker/approve-application", {
    method: "POST",
    body: { user_id: userId },
  });
}

// SSE Activity Feed helper
export function createActivityFeed(
  userId: string,
  onMessage: (data: unknown) => void,
  onError?: (error: Event) => void
): EventSource {
  const source = new EventSource(
    `${API_BASE}/api/seeker/activity-feed/${userId}`
  );

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      onMessage(event.data);
    }
  };

  source.onerror = (error) => {
    if (onError) onError(error);
  };

  return source;
}
