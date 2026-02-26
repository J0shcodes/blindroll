import { cn } from "@/lib/cn";
import type { TimelineItemProps } from "@/lib/types";

export function TimelineItem({ timestamp, title, description, icon, isLast = false }: TimelineItemProps) {
  return (
    <div className="flex gap-6">
      {/* Timeline rail */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div className="w-3 h-3 rounded-full bg-accent-purple mt-2" />
        {/* Line */}
        {!isLast && <div className="w-0.5 h-16 bg-border-light mt-2" />}
      </div>

      {/* Content */}
      <div className="pb-6">
        <p className="font-mono text-body-sm text-text-tertiary mb-1">{timestamp}</p>
        <div className="flex items-start gap-2">
          {icon && <div className="text-accent-purple mt-1">{icon}</div>}
          <div>
            <p className="text-body font-semibold text-text-primary">{title}</p>
            <p className="text-body-sm text-text-secondary mt-1">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
