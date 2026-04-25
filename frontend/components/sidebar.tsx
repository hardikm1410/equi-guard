"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, ShieldAlert, Database, BarChart3,
  FileText, Clock, Settings, Shield, Plus,
  Sparkles, LogOut, Sun, Moon
} from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/components/auth-context";
import { useTheme } from "./theme-provider";
import { DEMO_USER_EMAIL, API_URL } from "@/lib/constants";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload & Analyze", icon: Upload },
  { href: "/bias-detection", label: "Bias Detection", icon: ShieldAlert },
  { href: "/data-synthesizer", label: "Data Synthesizer", icon: Database },
  { href: "/model-evaluation", label: "Model Evaluation", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const COLLAPSED_WIDTH = 68;
export const EXPANDED_WIDTH = 240;

export function Sidebar() {
  const pathname = usePathname();
  const { expanded, setExpanded } = useSidebar();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
    const isDemo = user?.email === DEMO_USER_EMAIL;

  const handleMouseEnter = useCallback(() => {
    setExpanded(true);
  }, [setExpanded]);

  const handleMouseLeave = useCallback(() => {
    setExpanded(false);
  }, [setExpanded]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-content/[0.06] bg-sidebar transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        expanded ? "w-[240px]" : "w-[68px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center px-3 h-20 border-b border-content/[0.05] shrink-0">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-cta flex items-center justify-center shrink-0 shadow-lg shadow-cta/20">
            <Shield className="w-5 h-5 text-cta-foreground" />
          </div>
          <span
            className={cn(
              "text-lg font-bold tracking-tight text-content whitespace-nowrap transition-all duration-300",
              expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0"
            )}
          >
            EquiGuard
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="tour-sidebar flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              title={!expanded ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-content/[0.10] text-content border border-content/[0.20] "
                  : "text-content/50 hover:text-content/80 hover:bg-content/[0.04] border border-transparent"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors", isActive ? "text-content" : "text-content/40 group-hover:text-content/60")} />
              <span
                className={cn(
                  "truncate transition-all duration-300",
                  expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0 overflow-hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant */}
      <div className="border-t border-content/[0.06] p-3 shrink-0">
        <Link href="/ai-assistant"
          title={!expanded ? "AI Assistant" : undefined}
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-2",
            pathname === "/ai-assistant"
              ? "bg-content/[0.08] text-content border border-content/[0.12]"
              : "text-content/50 hover:text-content/80 hover:bg-content/[0.04] border border-transparent"
          )}
        >
          <Sparkles className={cn("w-[18px] h-[18px] shrink-0", pathname === "/ai-assistant" ? "text-content" : "text-content/40 group-hover:text-content/60")} />
          <span
            className={cn(
              "truncate transition-all duration-300",
              expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0 overflow-hidden"
            )}
          >
            AI Assistant
          </span>
        </Link>
        {!isDemo && (
          <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <p className="text-[11px] text-content/30 px-3 mb-2">Ask me anything about bias, fairness, or your dataset...</p>
          <Link href="/ai-assistant?new=true" className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-content/70 bg-content/[0.06] hover:bg-content/[0.1] border border-content/[0.1] transition-all">
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </Link>

        </div>
        )}
      </div>

      {/* Theme Toggle & User profile */}
      <div className="border-t border-content/[0.06] p-3 shrink-0 space-y-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "tour-theme-toggle flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-content/50 hover:text-content/80 hover:bg-content/[0.04] border border-transparent"
          )}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px] shrink-0 text-content/40" />
          ) : (
            <Moon className="w-[18px] h-[18px] shrink-0 text-content/40" />
          )}
          <span
            className={cn(
              "truncate transition-all duration-300",
              expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0 overflow-hidden"
            )}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cta flex items-center justify-center text-cta-foreground text-xs font-bold shrink-0">
              {user?.displayName?.[0] || user?.email?.[0] || "U"}
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0"
              )}
            >
              <p className="text-sm font-medium text-content/80 truncate">{user?.displayName || "User"}</p>
              <p className="text-[11px] text-content/30 truncate">{user?.email}</p>
            </div>
          </div>
          {expanded && (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-content/40 hover:text-content/80 hover:bg-content/[0.06] transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
