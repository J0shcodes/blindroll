"use client";

import React, { useState } from "react";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { CheckCircle, AlertCircle, Copy } from "lucide-react";

export default function RunPayrollPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [executed, setExecuted] = useState(false);

  if (executed) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6 py-12">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent-green/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-accent-green" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-h1 font-bold text-text-primary">Payroll Executed</h1>
            <p className="text-body text-text-secondary">All payments have been processed and recorded on-chain</p>
          </div>

          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-body-sm text-text-secondary">Transaction Hash</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-body-sm text-text-primary bg-bg-tertiary p-3 rounded-lg break-all">
                  0x7f3a2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
                </code>
                <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border-light space-y-2">
              <Button variant="secondary" fullWidth>
                View on Sepolia
              </Button>
              <Button variant="tertiary" fullWidth>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-h1 font-bold text-text-primary">Run Payroll</h1>
        <p className="text-body text-text-secondary">Execute monthly payroll for all active employees</p>
      </div>

      {/* Pre-flight Checklist */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Pre-flight Checklist</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-lg">
            <CheckCircle className="w-5 h-5 text-accent-green shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-text-primary">Treasury Funded</p>
              <p className="text-body-sm text-text-secondary">Balance: 50 ETH available</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-lg">
            <CheckCircle className="w-5 h-5 text-accent-green shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-text-primary">All Employees Active</p>
              <p className="text-body-sm text-text-secondary">6 active employees ready for payroll</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-accent-amber/5 border border-accent-amber/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-text-primary">Last Payroll: 31 days ago</p>
              <p className="text-body-sm text-text-secondary">
                Recommended monthly cycle is 30+ days. Ready to proceed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Payroll Summary</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-body-sm text-text-secondary">Employees to Pay</p>
              <p className="text-h2 font-bold text-text-primary">6</p>
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Network</p>
              <p className="text-body font-mono text-text-primary">Ethereum Sepolia</p>
            </div>
          </div>

          <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
            <p className="text-body-sm text-text-secondary">Treasury Status</p>
            <p className="font-mono text-body text-accent-green">[ENCRYPTED — sufficient]</p>
          </div>

          <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
            <p className="text-body-sm text-text-secondary">Individual Amounts</p>
            <p className="font-mono text-body text-accent-green">[ENCRYPTED — private]</p>
          </div>

          <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
            <p className="text-body-sm text-text-secondary">Estimated Gas Cost</p>
            <p className="font-mono text-body text-text-primary">~0.004 ETH (~$12)</p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation & Execute */}
      <Card className="border-accent-red/30">
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 mt-1 accent-accent-purple"
            />
            <span className="text-body text-text-primary">
              I confirm this will execute payroll and send encrypted payments to all active employees. This action
              cannot be reversed.
            </span>
          </label>

          <div className="bg-accent-red/5 border border-accent-red/20 rounded-lg p-4">
            <p className="text-body-sm text-accent-red">
              ⚠️ Warning: This transaction cannot be reversed. Please verify all details before proceeding.
            </p>
          </div>

          <Button variant="primary" fullWidth size="lg" disabled={!confirmed} onClick={() => setExecuted(true)}>
            Execute Payroll
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
