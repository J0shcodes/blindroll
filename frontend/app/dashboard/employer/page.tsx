"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { AddedAtCell, StatusCell } from "@/components/ui/EmployeesCell";
import { useContract, ContractAddress } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import {
  Users,
  Wallet,
  Send,
  Plus,
  ExternalLink,
  Copy,
  CheckCircle,
  Lock,
} from "lucide-react";
import { TreasuryDecryptInline } from "@/components/TreasuryDecryptInline";
import { DecryptSalaryButton } from "@/components/DecryptSalaryButton";

export default function EmployeeOverview() {
  const { address } = useWallet();
  const { contractAddress, employeeCount, employeeList } = useContract();

  const [copied, setCopied] = useState(false);

  function handleCopyContract() {
    if (!contractAddress) return;
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const employees = (employeeList ?? []).map((addr) => ({ address: addr }));

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          value={employeeCount !== undefined ? employeeCount.toString() : "..."}
          label="Total Employees"
          subtext="Registered on contract"
        />

        <div className="card space-y-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <p className="text-h3 font-bold text-text-primary">[ENCRYPTED]</p>
              <p className="text-body-sm text-text-secondary">Treasury Balance</p>
            </div>
          </div>
          <p className="text-caption text-text-tertiary flex items-center gap-1">
            <Lock className="w-3 h-3" /> Only you can decrypt this value
          </p>
          <TreasuryDecryptInline />
        </div>
        <StatCard icon={<Send className="w-6 h-6" />} value="-" label="Last Payroll" subtext="No event indexing yet" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/employer/payroll">
          <div className="card hover:border-accent-purple/40 transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                <Send className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <p className="text-body font-medium text-text-primary">Run Payroll</p>
                <p className="text-body-sm text-text-secondary">Distribute to all active employees</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/employer/employees">
          <div className="card hover:border-accent-purple/40 transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                <Plus className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <p className="text-body font-medium text-text-primary">Add Employee</p>
                <p className="text-body-sm text-text-secondary">Encrypt and register a new salary</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/employer/treasury">
          <div className="card hover:border-accent-purple/40 transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                <Wallet className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <p className="text-body font-medium text-text-primary">Fund Treasury</p>
                <p className="text-body-sm text-text-secondary">Deposit ETH before payroll</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Employee Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary">Employee Roster</h2>
            <p className="text-body-sm text-text-secondary mt-0.5">
              {employeeCount !== undefined
                ? `${employeeCount.toString()} employees registered on contract`
                : "Loading…"}
            </p>
          </div>
          <Link href="/dashboard/employer/employees">
            <Button variant="secondary" size="sm">
              Manage →
            </Button>
          </Link>
        </div>

        <Card>
          {employees.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="w-8 h-8 text-text-tertiary" />
              <p className="text-body text-text-secondary">No employees yet</p>
              <Link href="/dashboard/employer/employees">
                <Button variant="primary" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add your first employee
                </Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "address",
                  header: "Wallet Address",
                  render: (value) => (
                    <span className="font-mono text-body-sm text-text-primary">
                      {(value as string).slice(0, 10)}…{(value as string).slice(-6)}
                    </span>
                  ),
                },
                {
                  key: "address",
                  header: "Status",
                  render: (_, row) => <StatusCell address={(row as { address: ContractAddress }).address} />,
                },
                {
                  key: "address",
                  header: "Salary",
                  render: (_, row) => <DecryptSalaryButton
                      employeeAddress={(row as { address: ContractAddress }).address}
                    />,
                },
                {
                  key: "address",
                  header: "Added",
                  render: (_, row) => <AddedAtCell address={(row as { address: ContractAddress }).address} />,
                },
              ]}
              data={employees}
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Contract</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-body-sm text-text-secondary">Deployed address — share with employees</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-body-sm text-text-primary bg-bg-tertiary px-3 py-2 rounded-lg break-all">
                {contractAddress ?? "—"}
              </code>
              {contractAddress && (
                <button
                  onClick={handleCopyContract}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors shrink-0"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-accent-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              )}
              {contractAddress && (
                <a
                  href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors shrink-0"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-4 h-4 text-text-secondary" />
                </a>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-body-sm text-text-secondary">Employer wallet</p>
            <p className="font-mono text-body-sm text-text-primary">{address ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
