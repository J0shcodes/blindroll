import React from "react";
import { cn } from "@/lib/cn";
import type { CardProps } from "@/lib/types";

export function Card({ children, className, border = true, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-bg-secondary rounded-lg p-6",
        border && "border border-border-light",
        hover && "hover:border-border-medium transition-colors cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 pb-4 border-b border-border-light", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-4 pt-4 border-t border-border-light", className)}>{children}</div>;
}
