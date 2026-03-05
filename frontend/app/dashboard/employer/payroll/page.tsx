"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { useContract } from "@/hooks/useContract";
import { BLINDROLL_ABI } from "@/abi/abi";
import { 
  CheckCircle, AlertCircle, Copy, ExternalLink, Loader2 , Users, Wallet, Shield
} from "lucide-react";
import CheckItem from "@/components/ui/CheckItem";

export default function RunPayrollPage() {
  const {
    contractAddress,
    employeeCount,
    isConfigured,
    mutateAsync,
    isPending,
    isConfirmed,
    isConfirming,
    txHash,
    writeError
  } = useContract()
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const error = writeError ? writeError.message : null

  async function handleExecutePayroll() {
    if (!contractAddress) return

    
    await mutateAsync({
      address: contractAddress,
      abi: BLINDROLL_ABI,
      functionName: "executePayroll",
    })
  }

  function handleCopyHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isConfirmed) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6 py-12">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-accent-green/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-accent-green" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-h1 font-bold text-text-primary">Payroll Executed</h1>
            <p className="text-body text-text-secondary">
              All active employees have been paid. Balances updated on-chain.
            </p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 space-y-4 text-left">
            <div className="space-y-2">
              <p className="text-body-sm text-text-secondary">Transaction Hash</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-body-sm text-text-primary bg-bg-tertiary p-3 rounded-lg break-all">
                  {txHash}
                </code>
                <button
                  onClick={handleCopyHash}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
              {copied && <p className="text-body-sm text-accent-green">Copied!</p>}
            </div>
            <div className="pt-4 border-t border-border-light space-y-2">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" fullWidth className="gap-2">
                  <ExternalLink className="w-4 h-4" /> View on Sepolia Etherscan
                </Button>
              </a>
              <Button variant="tertiary" fullWidth onClick={() => { setConfirmed(false) }}>
                Run Another Payroll
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPending || isConfirming) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-accent-purple animate-spin" />
              <div className="space-y-1">
                <p className="text-body font-semibold text-text-primary">
                  {isPending ? "Waiting for wallet signature…" : "Confirming on Sepolia…"}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {isPending
                    ? "Confirm the payroll transaction in your wallet"
                    : "Payroll transaction submitted — awaiting block confirmation"}
                </p>
              </div>
              {isConfirming && txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-body-sm text-accent-purple hover:underline"
                >
                  View on Etherscan <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-h1 font-bold text-text-primary">Run Payroll</h1>
        <p className="text-body text-text-secondary">Execute monthly payroll for all active employees. Salaries are distributed from the treasury.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
          <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-accent-red">Transaction failed</p>
            <p className="text-body-sm text-accent-red/80">{error}</p>
          </div>
        </div>
      )}

      {/* Pre-flight Checklist */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Pre-flight checklist</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckItem
            icon={<Users className="w-4 h-4" />}
            label="Active employees"
            value={employeeCount !== undefined ? `${employeeCount.toString()} on payroll` : "Loading…"}
            ok={!!employeeCount && employeeCount > 0n}
          />
          <CheckItem
            icon={<Wallet className="w-4 h-4" />}
            label="Treasury"
            value="Funded (on-chain)"
            ok={true}
          />
          <CheckItem
            icon={<Shield className="w-4 h-4" />}
            label="Contract"
            value={isConfigured ? "Configured" : "Not configured"}
            ok={isConfigured}
          />
        </CardContent>
      </Card>

      {/* Payroll Summary
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
      </Card> */}

      {/* Confirmation & Execute */}
      <Card>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-purple-500 cursor-pointer"
            />
            <span className="text-body-sm text-text-secondary">
              I confirm I want to run payroll for all active employees. This transaction will
              distribute ETH from the treasury and cannot be reversed.
            </span>
          </label>
        </CardContent>
      </Card>

      <Button
        variant="primary"
        fullWidth
        disabled={!confirmed || !isConfigured}
        onClick={handleExecutePayroll}
      >
        Execute Payroll
      </Button>
    </div>
  );
}
