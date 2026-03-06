"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WalletAddress } from "@/components/WalletAddress";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { clearContractAddress } from "@/lib/contractConfig";
import { cn } from "@/lib/cn";
import { BarChart3, Send, Users, Wallet, Settings, Eye, DollarSign, LogOut } from "lucide-react";

const employerNavigation = [
  { icon: BarChart3, label: "Overview", href: "/dashboard/employer" },
  { icon: Send, label: "Run Payroll", href: "/dashboard/employer/payroll" },
  { icon: Users, label: "Employees", href: "/dashboard/employer/employees" },
  { icon: Wallet, label: "Treasury", href: "/dashboard/employer/treasury" },
  { icon: Settings, label: "Settings", href: "/dashboard/employer/settings" },
];

const employeeNavigation = [
  { icon: Eye, label: "Overview", href: "/dashboard/employee" },
  { icon: DollarSign, label: "My Salary", href: "/dashboard/employee/salary" },
  { icon: Wallet, label: "My Balance", href: "/dashboard/employee/balance" },
];

export function Sidebar() {
  const {shortAddress, disconnectWallet} = useWallet()
  const {isEmployer} = useContract()


  const pathname = usePathname();
  const router = useRouter()


  const navigation = isEmployer ? employerNavigation : employeeNavigation;

  async function handleDisconnect() {
    await disconnectWallet()

    clearContractAddress()

    router.push("/connect")
  }

  return (
    <div className="w-60 bg-bg-secondary border-r border-border-light h-screen flex flex-col fixed left-0 top-0 pt-4 md:pt-6 overflow-y-auto">
      {/* Logo */}
      <Link href="/" className="px-6 mb-8 block hover:opacity-80 transition-opacity">
        <Logo size="lg" showText />
      </Link>

      {/* Wallet Connection */}
      {shortAddress && (
        <div className="px-6 mb-8 pb-6 border-b border-border-light space-y-2">
          <p className="text-caption text-text-tertiary">Connected Wallet</p>
          <WalletAddress address={shortAddress} connected showIndicator className="text-body-sm" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                "text-body-sm font-medium",
                isActive
                  ? "bg-accent-purple/10 text-accent-purple border-l-2 border-accent-purple pl-3.5"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Network Status & Disconnect */}
      <div className="px-6 py-6 border-t border-border-light space-y-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-lg">
          <div className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
          <span className="text-caption text-text-secondary font-mono">Sepolia Testnet</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-body-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
