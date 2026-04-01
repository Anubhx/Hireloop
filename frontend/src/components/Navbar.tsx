"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Seeker", href: "/seeker" },
  { label: "Recruiter", href: "/recruiter" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-900 px-4 sm:px-8 h-[52px] flex items-center justify-between">
      <Link
        href="/"
        className="font-display text-lg font-bold text-white tracking-tight"
      >
        Hire<span className="text-accent">Loop</span>
      </Link>

      <div className="flex gap-0.5 bg-white/[0.07] rounded-full p-[3px]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-xs font-medium px-4 py-[6px] rounded-full transition-all duration-200 border-none ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="hidden sm:flex gap-3 items-center">
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/20 text-white/70">
          Figma Reference
        </span>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/20 text-white/70">
          v1.0
        </span>
      </div>
    </nav>
  );
}
