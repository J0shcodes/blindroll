import { Card } from "@/components/Card";

export default function TreasuryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-text-primary">Treasury Management</h1>
        <p className="text-text-secondary text-body mt-2">Fund and manage your organization&apos;s treasury</p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-4">
          <p className="text-text-secondary text-body">Treasury interface coming soon</p>
        </div>
      </Card>
    </div>
  );
}
