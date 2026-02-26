import { Card } from "@/components/Card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-text-primary">Organization Settings</h1>
        <p className="text-text-secondary text-body mt-2">Configure payroll schedule and organization settings</p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-4">
          <p className="text-text-secondary text-body">Settings interface coming soon</p>
        </div>
      </Card>
    </div>
  );
}
