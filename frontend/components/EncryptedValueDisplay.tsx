"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface EncryptedValueDisplayProps {
  value: string;
  decrypted?: string;
  label?: string;
  className?: string;
}

export function EncryptedValueDisplay({ value, decrypted, label, className }: EncryptedValueDisplayProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const isDecryptable = !!decrypted;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-text-secondary text-body-sm">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {isRevealed && isDecryptable ? (
            <div className="font-mono text-body text-text-primary">{decrypted}</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-6 bg-border-light rounded animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <Lock className="w-4 h-4 text-text-tertiary" />
            </div>
          )}
        </div>
        {isDecryptable && (
          <Button variant="secondary" size="sm" onClick={() => setIsRevealed(!isRevealed)} className="gap-2">
            {isRevealed ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Decrypt</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
