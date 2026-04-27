"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, COLLAPSED_WIDTH, EXPANDED_WIDTH } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { useAuth } from "@/components/auth-context";
import { Loader2 } from "lucide-react";

import { Menu, X, Shield, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/sidebar";
import { useState as useReactState } from "react";
import { cn } from "@/lib/utils";

function MobileNav() {
  const [isOpen, setIsOpen] = useReactState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className="md:hidden">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-content/[0.05] bg-sidebar/80 backdrop-blur-xl z-[60] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cta flex items-center justify-center shrink-0 shadow-lg shadow-cta/20">
            <Shield className="w-4 h-4 text-cta-foreground" />
          </div>
          <span className="text-xl md:text-lg font-bold tracking-tight text-content">EquiGuard</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-content/70 hover:text-content transition-colors rounded-lg bg-content/[0.03]"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown - Slide animation */}
      <div className={cn(
        "fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/60 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Sidebar content */}
        <div className={cn(
          "absolute top-0 right-0 h-full w-[280px] bg-sidebar border-l border-content/[0.06] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex flex-col h-full pt-20 pb-6 px-4">
            <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[13px] md:text-[10px] font-bold text-content/30 uppercase tracking-[0.2em] px-3 mb-4">Main Navigation</p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-md md:text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-content/[0.1] text-content border border-content/[0.1]" 
                        : "text-content/50 hover:text-content/90 hover:bg-content/[0.04] border border-transparent"
                    )}
                  >
                    <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-content" : "text-content/40")} />
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-6 border-t border-content/[0.06]" />
              <p className="text-[13px] md:text-[10px] font-bold text-content/30 uppercase tracking-[0.2em] px-3 mb-4">Support</p>
              
              <Link href="/ai-assistant" onClick={() => setIsOpen(false)} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-md md:text-sm font-medium transition-all",
                  pathname === "/ai-assistant" 
                    ? "bg-content/[0.1] text-content border border-content/[0.1]" 
                    : "text-content/50 hover:text-content/90 hover:bg-content/[0.04] border border-transparent"
                )}
              >
                <Sparkles className={cn("w-[18px] h-[18px]", pathname === "/ai-assistant" ? "text-content" : "text-content/40")} />
                AI Assistant
              </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-content/[0.06]">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-cta flex items-center justify-center text-cta-foreground text-sm font-bold shrink-0 shadow-lg shadow-cta/20">
                    {user?.displayName?.[0] || user?.email?.[0] || "U"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-md md:text-sm font-bold text-content truncate">{user?.displayName || "User"}</p>
                    <p className="text-[13px] md:text-[11px] text-content/30 truncate">{user?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { signOut(); setIsOpen(false); }} 
                  className="p-2.5 text-content/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-full",
          expanded ? 'md:ml-[240px]' : 'md:ml-[68px]',
          "ml-0"
        )}
      >
        <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-8 max-w-[100vw] overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-content/30" />
          <p className="text-sm text-content/30">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}