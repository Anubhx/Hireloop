import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#ECEBF5]">
      <Navbar />
      <div className="pt-[52px] flex items-center justify-center min-h-[calc(100vh-52px)]">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl font-bold text-text-primary tracking-tight mb-3">
            Hire<span className="text-accent">Loop</span>
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            AI-powered hiring platform. Two sides, one intelligent loop.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/seeker"
              className="bg-accent text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Job Seeker
            </Link>
            <Link
              href="/recruiter"
              className="bg-transparent text-text-secondary border border-border-color px-5 py-2.5 rounded-md text-sm font-medium hover:bg-surface-3 transition-colors"
            >
              Recruiter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
