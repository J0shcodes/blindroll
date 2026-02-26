import { cn } from "@/lib/cn";

interface StatusPillProps {
  status: "active" | "inactive" | "pending";
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const statusConfig = {
    active: { color: "bg-accent-green/10 text-accent-green", label: "Active" },
    inactive: { color: "bg-accent-amber/10 text-accent-amber", label: "Inactive" },
    pending: { color: "bg-accent-blue/10 text-accent-blue", label: "Pending" },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-caption font-medium",
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
