"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { useContract, useEmployeeStatus, ContractAddress } from "@/hooks/useContract";
import { useFhevm } from "@/hooks/useFhevm";
import { useWallet } from "@/hooks/useWallet";
import {
  DollarSign, Wallet, Download, Eye,
  Loader2, AlertCircle, Lock
} from "lucide-react";
import formatEth from "@/lib/formatEth";

export default function EmployeeOverview() {
  const {address} = useWallet()
  const { 
    contractAddress, 
    encryptedBalanceHandle, 
    encryptedSalaryHandle 
  } = useContract()

  const {isReady: fhevmReady, userDecrypt, initError} = useFhevm()

  const {addedAt, isLoading: statusLoading} = useEmployeeStatus(address as ContractAddress | undefined)

  const [salary, setSalary] = useState<string | null>(null);
  const [decryptingSalary, setDecryptingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [decryptingBalance, setDecryptingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  async function handleDecryptSalary() {
    if (!encryptedSalaryHandle || !contractAddress) return
    setDecryptingSalary(true)
    setSalaryError(null)

    try {
      const raw = await userDecrypt(encryptedSalaryHandle, contractAddress)

      if (typeof raw === "bigint") setSalary(formatEth(raw))
      else setSalaryError("Unexpected decryption format")        
    } catch (error) {
      setSalaryError(error instanceof Error ? error.message : "Decryption failed")
    } finally {
      setDecryptingSalary(false)
    }
  }

  async function handleDecryptBalance() {
    if (!encryptedBalanceHandle || !contractAddress) return
    setDecryptingBalance(false)
    setBalanceError(null)

    try {
      const raw = await userDecrypt(encryptedBalanceHandle, contractAddress)
      if (typeof raw === "bigint") setBalance(formatEth(raw))
      else setBalanceError("Unexpected decryption result")
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : "Decryption failed")
    } finally {
      setDecryptingBalance(false)
    }
  }

  return (
    <div className="space-y-8">
      {initError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
          <AlertCircle className="w-5 h-5 text-accent-amber shrink-0" />
          <p className="text-body-sm text-accent-amber">FHE SDK error: {initError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          value={salary ?? "[ENCRYPTED]"}
          label="My Salary"
          subtext={salary ? "Decrypted" : "Decrypt to view"}
        />
        <StatCard
          icon={<Wallet className="w-6 h-6" />}
          value={balance ?? "[ENCRYPTED]"}
          label="Available Balance"
          subtext={balance ? "Ready to withdraw" : "Decrypt to view"}
        />
      </div>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-h3 font-semibold text-text-primary">My Salary</h2>
              <p className="text-body-sm text-text-secondary flex items-center gap-1.5 mt-1">
                <Lock className="w-3.5 h-3.5" />
                Encrypted with FHE — only your wallet can see this
              </p>
            </div>
            <Link href="/dashboard/employee/salary">
              <Button variant="secondary" size="sm">Details →</Button>
            </Link>
          </div>

          <EncryptedValueDisplay
            value="[ENCRYPTED]"
            decrypted={salary ?? undefined}
            label="Monthly salary (ETH)"
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
            <button
              onClick={() => setSalary(null)}
              className="text-body-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Hide
            </button>
          )}

          {/* Meta row */}
          <div className="pt-4 border-t border-border-light grid grid-cols-2 gap-4">
            <div>
              <p className="text-body-sm text-text-secondary">Pay frequency</p>
              <p className="text-body font-medium text-text-primary">Monthly</p>
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Employee since</p>
              <p className="text-body font-medium text-text-primary">
                {statusLoading ? "…" : addedAt ? addedAt.toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-h3 font-semibold text-text-primary">Available Balance</h2>
              <p className="text-body-sm text-text-secondary mt-1">
                Accumulated from payroll runs — withdraw any time
              </p>
            </div>
            <Link href="/dashboard/employee/balance">
              <Button variant="secondary" size="sm">Withdraw →</Button>
            </Link>
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

          <div className="flex items-center gap-3">
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
            {balance && (
              <>
                <button
                  onClick={() => setBalance(null)}
                  className="text-body-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Hide
                </button>
                <Link href="/dashboard/employee/balance">
                  <Button variant="primary" size="sm" className="gap-2">
                    <Download className="w-4 h-4" /> Withdraw
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-h3 font-semibold text-text-primary">Contract</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-body-sm text-text-secondary">Blindroll contract</p>
              <p className="font-mono text-body-sm text-text-primary break-all">
                {contractAddress
                  ? `${contractAddress.slice(0, 10)}…${contractAddress.slice(-6)}`
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-body-sm text-text-secondary">Your wallet</p>
              <p className="font-mono text-body-sm text-text-primary break-all">
                {address ?? "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
