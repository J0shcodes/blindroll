"use client"

import { useState } from "react";
import { Card } from "@/components/Card";
import { ContractAddress } from "@/hooks/useContract";
import { useContract } from "@/hooks/useContract";
import AddEmployeeModal from "@/components/dashboard/AddEmployeeModal";
import RemoveEmployeeModal from "@/components/dashboard/RemoveEmployeModal";
import { Button } from "@/components/Button";
import { Plus, Users, UserX } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { AddedAtCell, StatusCell } from "@/components/ui/EmployeesCell";

export interface EmployeeRowData {
  address: ContractAddress
  status: "active" | "inactive"
  addedAt: string
}

export default function EmployeesPage() {
  const { employeeList, employeeCount } = useContract();
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const employees: EmployeeRowData[] = (employeeList ?? []).map((addr) => ({
    address: addr,
    status: "active" as const,
    addedAt: "-"
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="">
          <h1 className="lg:text-h2 sm:text-lg font-bold text-text-primary">Manage Employees</h1>
          <p className="text-text-secondary md:text-body text-sm mt-2">
          {employeeCount !== undefined ? `${employeeCount.toString()} employees on payroll` : "Loading..."}
          </p>
        </div>
        <Button variant="primary" size="md" className="gap-2 shrink-0 md:flex hidden" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
        {/* Mobile Button */}
        <Button variant="primary" size="sm" className="gap-2 shrink-0 md:hidden flex md:text-base text-sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-2 h-2 md:block" />
          Add Employee
        </Button>
      </div>

      <Card>
        {employees.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Users className="w-10 h-10 text-text-tertiary" />
            <div className="space-y-1">
              <p className="text-body font-medium text-text-primary">No employees yet</p>
              <p className="text-body-sm text-text-secondary">Add your first employee to start running payroll</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Employee
            </Button>
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
                key: "status",
                header: "Status",
                render: (_, row) => <StatusCell address={(row as EmployeeRowData).address} />,
              },
              {
                key: "addedAt",
                header: "Added",
                render: (_, row) => <AddedAtCell address={(row as EmployeeRowData).address} />,
              },
              {
                key: "address",
                header: "",
                render: (value) => (
                  <button
                    onClick={() => setRemoveTarget(value as string)}
                    className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors text-text-tertiary hover:text-accent-red"
                    title="Remove employee"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            data={employees}
          />
        )}
      </Card>

      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)}/>}
      {removeTarget && <RemoveEmployeeModal address={removeTarget} onClose={() => setRemoveTarget(null)}/>}
    </div>
  );
}
