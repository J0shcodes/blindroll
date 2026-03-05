"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { TimelineItem } from "@/components/TimelineItem";
import { useContract } from "@/hooks/useContract";
import { useFhevm } from "@/hooks/useFhevm";
import { DollarSign, Eye, Loader2, AlertCircle, Lock } from "lucide-react";

function formatEth(wei: bigint): string {
  const eth = Number(wei) / 1e18
  return eth.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 6}) + " ETH"
}

export default function SalaryPage() {
  const {
    contractAddress, 
    encryptedSalaryHandle, 
    encryptedBalanceHandle, 
  } = useContract()

  const {isReady: fhevmReady, userDecrypt, initError} = useFhevm()

  const [salary, setSalary] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [decryptingSalary, setDecryptingSalary] = useState(false);
  const [decryptingBalance, setDecryptingBalance] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  async function handleDecryptSalary() {
    if (!encryptedSalaryHandle || !contractAddress) return;
    setDecryptingSalary(true);
    setSalaryError(null);
    try {
      const raw = await userDecrypt(encryptedSalaryHandle, contractAddress);
      if (typeof raw === "bigint") {
        setSalary(formatEth(raw));
      } else {
        setSalaryError("Unexpected decryption result");
      }
    } catch (err) {
      setSalaryError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setDecryptingSalary(false);
    }
  }

  async function handleDecryptBalance() {
    if (!encryptedBalanceHandle || !contractAddress) return;
    setDecryptingBalance(true);
    setBalanceError(null);
    try {
      const raw = await userDecrypt(encryptedBalanceHandle, contractAddress);
      if (typeof raw === "bigint") {
        setBalance(formatEth(raw));
      } else {
        setBalanceError("Unexpected decryption result");
      }
    } catch (err) {
      setBalanceError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setDecryptingBalance(false);
    }
  }

  const paymentHistory = [
    {
      timestamp: "On-chain event indexing not yet implemented",
      title: "Payment history",
      description: "Your payment history will appear here once event indexing is added",
    },
  ];


  return (
    <div className="space-y-8">
      {/* FHE init warning */}
      {initError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
          <AlertCircle className="w-5 h-5 text-accent-amber shrink-0" />
          <p className="text-body-sm text-accent-amber">FHE SDK error: {initError}</p>
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          value={salary ?? "[ENCRYPTED]"}
          label="My Salary"
          subtext={salary ? "Decrypted" : "Click Decrypt to view"}
        />
        <StatCard
          icon={<Eye className="w-6 h-6" />}
          value={balance ?? "[ENCRYPTED]"}
          label="Available Balance"
          subtext={balance ? "Accumulated from payroll" : "Click Decrypt to view"}
        />
      </div>

      {/* Salary decrypt card */}
      <Card>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary mb-1">Monthly Salary</h2>
            <p className="text-body-sm text-text-secondary flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Encrypted with FHE — only your wallet can decrypt this value
            </p>
          </div>

          <EncryptedValueDisplay
            value="[ENCRYPTED]"
            decrypted={salary ?? undefined}
            label="Salary (ETH / month)"
          />

          {salaryError && (
            <p className="text-body-sm text-accent-red flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {salaryError}
            </p>
          )}

          {!salary && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleDecryptSalary}
              disabled={decryptingSalary || !fhevmReady || !encryptedSalaryHandle}
            >
              {decryptingSalary ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Decrypting…</>
              ) : !fhevmReady ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Initializing FHE…</>
              ) : (
                <><Eye className="w-4 h-4" /> Decrypt Salary</>
              )}
            </Button>
          )}

          {salary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSalary(null)}
            >
              Hide
            </Button>
          )}

          <div className="pt-6 border-t border-border-light space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-body-sm text-text-secondary">Pay frequency</p>
                <p className="text-body font-medium text-text-primary">Monthly</p>
              </div>
              <div>
                <p className="text-body-sm text-text-secondary">Currency</p>
                <p className="text-body font-medium text-text-primary">ETH (Sepolia)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance decrypt card */}
      <Card>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary mb-1">Accumulated Balance</h2>
            <p className="text-body-sm text-text-secondary">
              Balance accrued from payroll runs — withdraw from the Balance page
            </p>
          </div>

          <EncryptedValueDisplay
            value="[ENCRYPTED]"
            decrypted={balance ?? undefined}
            label="Balance (ETH)"
          />

          {balanceError && (
            <p className="text-body-sm text-accent-red flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {balanceError}
            </p>
          )}

          {!balance && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleDecryptBalance}
              disabled={decryptingBalance || !fhevmReady || !encryptedBalanceHandle}
            >
              {decryptingBalance ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Decrypting…</>
              ) : (
                <><Eye className="w-4 h-4" /> Decrypt Balance</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-h3 font-semibold text-text-primary">Payment History</h2>
          <div className="space-y-2">
            {paymentHistory.map((item, i) => (
              <TimelineItem key={i} {...item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
