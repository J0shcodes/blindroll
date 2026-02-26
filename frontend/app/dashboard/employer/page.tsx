"use client"

import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { TimelineItem } from "@/components/TimelineItem";
import { StatusPill } from "@/components/StatusPill";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { Users, Wallet, Clock, Calendar, MoreVertical, Plus, TrendingUp } from "lucide-react";

interface Employee {
  id: string;
  address: string;
  status: "active" | "inactive" | "pending";
  salary: string;
  balance: string;
  added: string;
}

export default function EmployeeOverview() {
  const employees: Employee[] = [
    {
      id: "1",
      address: "0x1234...5678",
      status: "active",
      salary: "[ENCRYPTED]",
      balance: "[ENCRYPTED]",
      added: "2024-01-15",
    },
    {
      id: "2",
      address: "0x2345...6789",
      status: "active",
      salary: "[ENCRYPTED]",
      balance: "[ENCRYPTED]",
      added: "2024-01-20",
    },
    {
      id: "3",
      address: "0x3456...7890",
      status: "inactive",
      salary: "[ENCRYPTED]",
      balance: "[ENCRYPTED]",
      added: "2024-02-01",
    },
    {
      id: "4",
      address: "0x4567...8901",
      status: "active",
      salary: "[ENCRYPTED]",
      balance: "[ENCRYPTED]",
      added: "2024-02-05",
    },
    {
      id: "5",
      address: "0x5678...9012",
      status: "active",
      salary: "[ENCRYPTED]",
      balance: "[ENCRYPTED]",
      added: "2024-02-10",
    },
    {
      id: "6",
      address: "0x6789...0123",
      status: "pending",
      salary: "[ENCRYPTED]",
      balance: "[ENCRYPTED]",
      added: "2024-02-15",
    },
  ];

  const activities = [
    {
      timestamp: "2024-02-20 14:32 UTC",
      title: "Payroll Executed",
      description: "Monthly payroll processed for 6 employees",
    },
    {
      timestamp: "2024-02-15 10:15 UTC",
      title: "Treasury Funded",
      description: "Received 50 ETH to treasury wallet",
    },
    {
      timestamp: "2024-02-10 09:00 UTC",
      title: "Employee Deactivated",
      description: "0x5678...9012 marked as inactive",
    },
    {
      timestamp: "2024-02-05 16:45 UTC",
      title: "Salary Updated",
      description: "0x4567...8901 salary adjusted",
    },
    {
      timestamp: "2024-01-31 11:20 UTC",
      title: "Employee Added",
      description: "0x6789...0123 added to payroll",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          value="6"
          label="Active Employees"
          subtext="2 pending activation"
        />
        <StatCard
          icon={<Wallet className="w-6 h-6" />}
          value="[ENCRYPTED]"
          label="Treasury Balance"
          subtext="Sufficient for payroll"
        />
        <StatCard icon={<Clock className="w-6 h-6" />} value="2024-01-20" label="Last Payroll" subtext="31 days ago" />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          value="2024-03-20"
          label="Next Payroll"
          subtext="In 28 days"
        />
      </div>

      {/* Employee Roster */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h2 font-bold text-text-primary">Employee Roster</h2>
            <p className="text-text-secondary text-body mt-1">Manage and monitor active employees</p>
          </div>
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        <Card>
          <DataTable
            columns={[
              {
                key: "address",
                header: "Wallet Address",
                render: (value) => <span className="font-mono text-body-sm">{value as string}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (value) => <StatusPill status={value as "active" | "inactive"} />,
              },
              {
                key: "salary",
                header: "Salary",
                render: () => <EncryptedValueDisplay value="[ENCRYPTED]" />,
              },
              {
                key: "balance",
                header: "Balance",
                render: () => <EncryptedValueDisplay value="[ENCRYPTED]" />,
              },
              {
                key: "added",
                header: "Added",
                render: (value) => <span className="text-body-sm">{value as string}</span>,
              },
              {
                key: "id",
                header: "Actions",
                render: () => (
                  <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                  </button>
                ),
              },
            ]}
            data={employees}
            rowKey="id"
          />
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <h2 className="text-h2 font-bold text-text-primary">Recent Activity</h2>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <TimelineItem
                  key={idx}
                  timestamp={activity.timestamp}
                  title={activity.title}
                  description={activity.description}
                  icon={<TrendingUp className="w-4 h-4" />}
                  isLast={idx === activities.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
