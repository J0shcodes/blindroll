"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { TimelineItem } from "@/components/TimelineItem";
import { Download, TrendingUp, CheckCircle } from "lucide-react";

export default function BalancePage() {
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const withdrawalHistory = [
    {
      timestamp: "2024-02-10 10:30 UTC",
      title: "Withdrawal Completed",
      description: "Successfully withdrew 1.2 ETH to your wallet",
    },
    {
      timestamp: "2024-01-15 09:45 UTC",
      title: "Withdrawal Completed",
      description: "Successfully withdrew 2.3 ETH to your wallet",
    },
  ];

  if (withdrawSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6 py-12">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-accent-green/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-accent-green" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-h1 font-bold text-text-primary">Withdrawal Requested</h1>
            <p className="text-body text-text-secondary">Your withdrawal request has been submitted</p>
          </div>

          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-body-sm text-text-secondary">Amount</p>
              <p className="text-h2 font-bold text-text-primary">{withdrawAmount} ETH</p>
            </div>

            <div className="space-y-2">
              <p className="text-body-sm text-text-secondary">Status</p>
              <p className="text-body font-medium text-text-primary">Processing...</p>
            </div>

            <div className="pt-4 border-t border-border-light">
              <Button
                variant="tertiary"
                fullWidth
                onClick={() => {
                  setShowWithdrawForm(false);
                  setWithdrawSuccess(false);
                }}
              >
                Back to Balance
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showWithdrawForm) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-text-primary">Withdraw Funds</h1>
          <p className="text-text-secondary text-body mt-2">Enter the amount you wish to withdraw to your wallet</p>
        </div>

        <Card>
          <CardContent className="space-y-6">
            <EncryptedValueDisplay value="[ENCRYPTED]" decrypted="3.5 ETH ($12,250)" label="Available Balance" />

            <div className="pt-6 border-t border-border-light space-y-4">
              <Input
                label="Withdrawal Amount (ETH)"
                type="number"
                placeholder="1.0"
                step="0.1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />

              <div className="space-y-2">
                <p className="text-body-sm text-text-secondary">Estimated Fee: ~0.001 ETH</p>
                <p className="text-body-sm text-text-secondary">
                  You will receive: {parseFloat(withdrawAmount || "0") - 0.001} ETH
                </p>
              </div>

              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-4">
                <p className="text-body-sm text-accent-blue">
                  ℹ️ Funds will be sent to your connected wallet on Ethereum Sepolia. Allow up to 5 minutes for
                  confirmation.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="primary" fullWidth disabled={!withdrawAmount} onClick={() => setWithdrawSuccess(true)}>
                  Confirm Withdrawal
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setShowWithdrawForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <h2 className="text-h2 font-bold text-text-primary">Available Balance</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <EncryptedValueDisplay value="[ENCRYPTED]" decrypted="3.5 ETH ($12,250)" label="Total Available" />

          <div className="pt-6 border-t border-border-light">
            <Button variant="primary" fullWidth size="lg" className="gap-2" onClick={() => setShowWithdrawForm(true)}>
              <Download className="w-4 h-4" />
              Withdraw Funds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <div className="space-y-6">
        <h2 className="text-h2 font-bold text-text-primary">Withdrawal History</h2>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {withdrawalHistory.map((withdrawal, idx) => (
                <TimelineItem
                  key={idx}
                  timestamp={withdrawal.timestamp}
                  title={withdrawal.title}
                  description={withdrawal.description}
                  icon={<TrendingUp className="w-4 h-4" />}
                  isLast={idx === withdrawalHistory.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
