"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isEmployer = pathname.includes("employer");
  const userType = isEmployer ? "employer" : "employee";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTitleFromPath = (path: string): string => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) {
      return userType === "employer" ? "Overview" : "Overview";
    }
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const title = getTitleFromPath(pathname);
  console.log(title)

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
            <h1 className="text-h3 font-semibold text-text-primary">{title} Overview</h1>
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
