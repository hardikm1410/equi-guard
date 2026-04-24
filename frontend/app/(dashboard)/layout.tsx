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

function MobileNav() {
  const [isOpen, setIsOpen] = useReactState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className="md:hidden">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-20 border-b border-content/[0.05] bg-sidebar/80 backdrop-blur-xl z-50 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cta flex items-center justify-center shrink-0 shadow-lg shadow-cta/20">
            <Shield className="w-5 h-5 text-cta-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-content">EquiGuard</span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-content/70 hover:text-content">
          {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm overflow-y-auto pb-6">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-content/[0.08] text-content border border-content/[0.12]" : "text-content/60 hover:text-content/90 hover:bg-content/[0.04] border border-transparent"}`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-content" : "text-content/50"}`} />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-4 border-t border-content/[0.06]" />

            <Link href="/ai-assistant" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname === "/ai-assistant" ? "bg-content/[0.08] text-content border border-content/[0.12]" : "text-content/60 hover:text-content/90 hover:bg-content/[0.04] border border-transparent"}`}>
              <Sparkles className={`w-[18px] h-[18px] ${pathname === "/ai-assistant" ? "text-content" : "text-content/50"}`} />
              AI Assistant
            </Link>

            <div className="mt-6 pt-4 border-t border-content/[0.06] flex items-center justify-between px-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-cta flex items-center justify-center text-cta-foreground text-xs font-bold shrink-0">{user?.displayName?.[0] || user?.email?.[0] || "U"}</div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-content/80 truncate">{user?.displayName || "User"}</p>
                  <p className="text-[11px] text-content/30 truncate">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => { signOut(); setIsOpen(false); }} className="p-2 text-content/40 hover:text-content/80 hover:bg-content/[0.06] rounded-lg">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
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
        className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-full ${expanded ? 'md:ml-[240px]' : 'md:ml-[68px]'} ml-0`}
      >
        <div className="relative z-10 p-4 md:p-8 pt-20 md:pt-8">
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
