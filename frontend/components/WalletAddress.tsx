import React from "react";
import { cn } from "@/lib/cn";

interface WalletAddressProps {
  address: string;
  showIndicator?: boolean;
  connected?: boolean;
  className?: string;
  short?: boolean;
}

export function WalletAddress({
  address,
  showIndicator = true,
  connected = true,
  className,
  short = true,
}: WalletAddressProps) {
  const truncateAddress = (addr: string) => {
    if (short) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return addr;
  };

  return (
    <div className={cn("flex items-center gap-2 font-mono text-body-sm text-text-primary", className)}>
      {showIndicator && <div className={cn("w-2 h-2 rounded-full", connected ? "bg-accent-green" : "bg-accent-red")} />}
      <span>{truncateAddress(address)}</span>
    </div>
  );
}
