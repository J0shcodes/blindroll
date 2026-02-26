import React from "react";
import { cn } from "@/lib/cn";
import type { InputProps } from "@/lib/types";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-body-sm font-medium text-text-primary mb-2">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-3 text-text-secondary">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded-lg",
              "focus:outline-none focus:border-border-medium transition-colors",
              "placeholder:text-text-tertiary",
              icon && "pl-10",
              error && "border-accent-red",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-accent-red text-body-sm mt-1">{error}</p>}
        {helpText && !error && <p className="text-text-tertiary text-body-sm mt-1">{helpText}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
