"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { TimelineItem } from "@/components/TimelineItem";
import { Edit3 } from "lucide-react";

export default function SalaryPage() {
  const salaryHistory = [
    {
      timestamp: "2024-02-01 00:00 UTC",
      title: "Salary Update",
      description: "Salary increased by 10% effective immediately",
    },
    {
      timestamp: "2024-01-15 00:00 UTC",
      title: "Initial Salary",
      description: "Onboarded with initial salary amount",
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Current Salary */}
      <Card>
        <CardHeader>
          <h2 className="text-h2 font-bold text-text-primary">Current Salary</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <EncryptedValueDisplay value="[ENCRYPTED]" decrypted="$8,500.00 / month" label="Monthly Base Salary" />

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-light">
            <div>
              <p className="text-body-sm text-text-secondary">Effective Date</p>
              <p className="text-body font-medium text-text-primary">2024-02-01</p>
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Payment Frequency</p>
              <p className="text-body font-medium text-text-primary">Monthly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annual Equivalent */}
      <Card>
        <CardContent className="space-y-4">
          <p className="text-body-sm text-text-secondary">Annual Equivalent</p>
          <p className="text-h2 font-bold text-text-primary">$102,000</p>
          <p className="text-body-sm text-text-secondary">Based on current monthly salary</p>
        </CardContent>
      </Card>

      {/* Salary History */}
      <div className="space-y-6">
        <h2 className="text-h2 font-bold text-text-primary">Salary History</h2>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {salaryHistory.map((entry, idx) => (
                <TimelineItem
                  key={idx}
                  timestamp={entry.timestamp}
                  title={entry.title}
                  description={entry.description}
                  icon={<Edit3 className="w-4 h-4" />}
                  isLast={idx === salaryHistory.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
