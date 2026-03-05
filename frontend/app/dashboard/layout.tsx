"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter()

  const {isConnected, isCorrectNetwork, address, shortAddress} = useWallet()
  const {isEmployer, isEmployee, isRoleLoading} = useContract()
  // const isEmployer = pathname.includes("employer");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userType = isEmployer ? "employer" : "employee";

  const redirectTarget = (() => {
    if (isRoleLoading) return null

    if (!isConnected) {
      router.replace("/connect")
      return
    }

    const isEmployerPath = pathname.includes("/employer")
    const isEmployeePath = pathname.includes("/employee")

    if (isEmployerPath && !isEmployer) {
      if (isEmployee) return "/dashboard/employee"
    }

    if (isEmployeePath && !isEmployee) {
      if (isEmployer) return "/dashbord/employer"
    }

    return null
  })()

  useEffect(() => {
    if (!redirectTarget) return

    router.replace(redirectTarget)
  }, [redirectTarget, router])

  const guardReady = !isRoleLoading && !redirectTarget

  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  const title = 
    lastSegment === "employer" || lastSegment === "employee" 
      ? "Overview" 
      : lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)

  if (!guardReady) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
          <p className="text-body">Loading…</p>
        </div>
      </div>
    );
  }

  const showNetworkBanner = isConnected && !isCorrectNetwork;

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-60 fixed left-0 top-0 h-screen">
        <Sidebar userType={userType} walletAddress="0x1234...5678" />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`lg:hidden fixed left-0 top-0 h-screen w-60 z-50 transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar userType={userType} walletAddress="0x1234...5678" />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        {showNetworkBanner && (
          <div className="w-full bg-accent-amber/10 border-b border-accent-amber/20 px-4 py-2 text-center">
            <p className="text-body-sm text-accent-amber">
              Wrong network — please switch to <strong>Sepolia</strong> in your wallet
            </p>
          </div>
        )}

        {/* Top Bar */}
        <div className="h-14 border-b border-border-light bg-bg-primary flex items-center justify-between px-4 lg:px-8 lg:ml-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-bg-secondary rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-text-primary" />
              )}
            </button>
            <h1 className="text-h3 font-semibold text-text-primary">{title}</h1>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-bg-primary">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
