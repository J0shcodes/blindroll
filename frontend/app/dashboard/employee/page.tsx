"use client";

import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { TimelineItem } from "@/components/TimelineItem";
import { DollarSign, Eye, Calendar, Download, TrendingUp } from "lucide-react";

export default function EmployeeOverview() {
  const paymentHistory = [
    {
      timestamp: "2024-02-20 14:32 UTC",
      title: "Salary Paid",
      description: "Monthly salary deposited to your account",
    },
    {
      timestamp: "2024-01-20 14:32 UTC",
      title: "Salary Paid",
      description: "Monthly salary deposited to your account",
    },
    {
      timestamp: "2024-12-20 14:32 UTC",
      title: "Salary Paid",
      description: "Monthly salary deposited to your account",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Salary Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          value="[ENCRYPTED]"
          label="My Salary"
          subtext="Click Decrypt to view"
        />
        <StatCard
          icon={<Eye className="w-6 h-6" />}
          value="[ENCRYPTED]"
          label="Available Balance"
          subtext="Accumulated from payroll"
        />
      </div>

      {/* Salary Card with Decrypt */}
      <Card>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary mb-4">My Salary Details</h2>
            <EncryptedValueDisplay value="[ENCRYPTED]" decrypted="$8,500.00" label="Monthly Salary" />
          </div>

          <div className="pt-6 border-t border-border-light space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-body-sm text-text-secondary">Effective Date</p>
                <p className="text-body font-medium text-text-primary">2024-01-15</p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary">Frequency</p>
                <p className="text-body font-medium text-text-primary">Monthly</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance & Withdraw */}
      <Card>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary mb-4">Available Balance</h2>
            <div className="space-y-4">
              <EncryptedValueDisplay value="[ENCRYPTED]" decrypted="3.5 ETH ($12,250)" label="Total Accumulated" />
              <Button variant="primary" fullWidth size="lg" className="gap-2 mt-4">
                <Download className="w-4 h-4" />
                Withdraw Funds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <div className="space-y-6">
        <h2 className="text-h2 font-bold text-text-primary">Payment History</h2>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.map((payment, idx) => (
                <TimelineItem
                  key={idx}
                  timestamp={payment.timestamp}
                  title={payment.title}
                  description={payment.description}
                  icon={<TrendingUp className="w-4 h-4" />}
                  isLast={idx === paymentHistory.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
