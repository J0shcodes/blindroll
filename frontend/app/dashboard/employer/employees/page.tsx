import { Card } from "@/components/Card";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-text-primary">Manage Employees</h1>
        <p className="text-text-secondary text-body mt-2">Add, update, or remove employees from your payroll</p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-4">
          <p className="text-text-secondary text-body">Employee management interface coming soon</p>
        </div>
      </Card>
    </div>
  );
}
