"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  FileText,
  Users,
  Activity,
  PenTool,
  Shield,
  BarChart3,
  User,
  Menu,
  X,
} from "lucide-react";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}

const seekerItems: SidebarItem[] = [
  { icon: Home, href: "/seeker", label: "Dashboard" },
  { icon: Search, href: "/seeker/discovery", label: "Job Discovery" },
  { icon: FileText, href: "/seeker/applications", label: "Applications" },
  { icon: Activity, href: "/seeker/activity", label: "Agent Feed" },
  { icon: User, href: "/seeker/profile", label: "Profile" },
];

const recruiterItems: SidebarItem[] = [
  { icon: Home, href: "/recruiter", label: "Dashboard" },
  { icon: PenTool, href: "/recruiter/post", label: "Post Job" },
  { icon: Users, href: "/recruiter/candidates", label: "Candidates" },
  { icon: BarChart3, href: "/recruiter/pipeline", label: "Pipeline" },
  { icon: Shield, href: "/recruiter/audit", label: "Audit Log" },
];

interface SidebarProps {
  role: "seeker" | "recruiter";
}

function SidebarContent({ items, pathname, role }: { items: SidebarItem[]; pathname: string; role: string }) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== `/${role}` && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors duration-150 ${
              isActive ? "bg-accent" : "hover:bg-white/[0.07]"
            }`}
            title={item.label}
          >
            <Icon
              className={`w-[18px] h-[18px] ${
                isActive ? "text-white" : "text-white/50"
              }`}
            />
          </Link>
        );
      })}
      <div className="flex-1" />
    </>
  );
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = role === "seeker" ? seekerItems : recruiterItems;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 w-10 h-10 bg-brand-800 rounded-lg flex items-center justify-center shadow-elevated"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`md:hidden fixed top-[52px] left-0 bottom-0 z-40 w-14 bg-brand-800 py-3 flex flex-col items-center gap-1 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/[0.07] mb-1"
        >
          <X className="w-[18px] h-[18px] text-white/50" />
        </button>
        <SidebarContent items={items} pathname={pathname} role={role} />
      </div>

      {/* Desktop sidebar - always visible on md+ */}
      <div className="hidden md:flex w-14 bg-brand-800 py-3 flex-col items-center gap-1 shrink-0">
        <SidebarContent items={items} pathname={pathname} role={role} />
      </div>
    </>
  );
}
