import { cn } from "@/lib/cn";
import type { StatCardProps } from "@/lib/types";

export function StatCard({ icon, value, label, subtext, className }: StatCardProps) {
  return (
    <div className={cn("bg-bg-secondary border border-border-light rounded-lg p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-text-secondary text-body-sm">{label}</p>
          <div className="xl:text-h2 lg:text-2xl text-lg font-bold text-text-primary">{value}</div>
          {subtext && <p className="text-text-tertiary text-body-sm">{subtext}</p>}
        </div>
        <div className="text-accent-purple">{icon}</div>
      </div>
    </div>
  );
}
