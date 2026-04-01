"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useUserStore } from "@/lib/store";
import { uploadResume } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function SeekerProfile() {
  const router = useRouter();
  const { userId } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a PDF or DOCX file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File must be smaller than 5MB");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const result = await uploadResume(userId, file);
        setExtractedSkills(result.skills || []);
        setUploadSuccess(true);

        // Redirect to discovery after short delay
        setTimeout(() => {
          router.push("/seeker/discovery");
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
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
                My Profile
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Resume, skills, and preferences
              </p>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="p-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border-strong rounded-lg p-8 text-center bg-surface-2 cursor-pointer hover:border-accent transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleInputChange}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <div className="text-sm font-medium text-text-primary">
                    Parsing resume...
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Extracting skills and experience
                  </div>
                </div>
              ) : uploadSuccess ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center text-success text-lg">
                    ✓
                  </div>
                  <div className="text-sm font-medium text-success">
                    Resume uploaded successfully!
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Redirecting to job discovery...
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm font-medium text-text-primary">
                    Drop your resume here
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">
                    PDF, DOCX — max 5MB
                  </div>
                  <button
                    type="button"
                    className="mt-3 bg-accent text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    Choose file
                  </button>
                </>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3 bg-danger-light rounded-md p-3">
                <div className="text-[11px] font-semibold text-danger">{error}</div>
              </div>
            )}

            {/* Success: Extracted Skills */}
            {uploadSuccess && extractedSkills.length > 0 && (
              <div className="mt-3 bg-success-light rounded-md p-3">
                <div className="text-[11px] font-semibold text-success mb-2">
                  ✓ Agent extracted from your resume
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {extractedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-light text-accent border border-accent/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info box */}
            {!uploadSuccess && !error && (
              <div className="mt-3 bg-success-light rounded-md p-3">
                <div className="text-[11px] font-semibold text-success mb-2">
                  ✓ Agent will extract from your resume
                </div>
                <p className="text-[11px] text-text-muted">
                  Skills, experience, and education will be auto-detected.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
