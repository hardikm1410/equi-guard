import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  titleClassName?: string;
}

export function PageHeader({ title, description, action, titleClassName }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8">
      <div>
        <h1 className={cn("text-2xl md:text-2xl font-bold tracking-tight", titleClassName || "text-primary")}>{title}</h1>
        <p className="text-sm md:text-sm text-content/40 mt-1">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: string;
  className?: string;
}

export function StatCard({ label, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("glass-card rounded-xl p-4 md:p-5 transition-all duration-300 hover:bg-content/[0.05] hover:border-content/[0.1]", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[13px] md:text-xs font-medium uppercase tracking-widest text-content/40">{label}</p>
        {Icon && (
          <div className="w-9 h-9 md:w-8 md:h-8 rounded-lg flex items-center justify-center bg-content/[0.06]">
            <Icon className="w-5 h-5 md:w-4 md:h-4 text-content/70" />
          </div>
        )}
      </div>
      <p className="text-2xl md:text-2xl font-bold text-content tracking-tight">{value}</p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <span className={cn("text-[13px] md:text-xs font-medium", trend.positive ? "text-content/70" : "text-content/40")}>{trend.value}</span>
          )}
          {subtitle && <span className="text-[13px] md:text-xs text-content/30">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
