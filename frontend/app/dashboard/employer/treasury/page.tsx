"use client"

import { useState } from "react";
import { parseEther } from "viem";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { TimelineItem } from "@/components/TimelineItem";
import { useContract } from "@/hooks/useContract";
import { useFhevm } from "@/hooks/useFhevm";
import { useWallet } from "@/hooks/useWallet";
import { BLINDROLL_ABI } from "@/abi/abi";
import {
  CheckCircle, AlertCircle, ExternalLink, Loader2, Wallet, Copy
} from "lucide-react";


export default function TreasuryPage() {
  const { address } = useWallet()
  const {
    contractAddress,
    encryptedTreasuryHandle,
    mutateAsync,
    isPending,
    isConfirmed,
    isConfirming,
    txHash,
    writeError
  } = useContract()

  const {isReady: fhevmReady, userDecrypt} = useFhevm()

  const [depositAmount, setDepositAmount] = useState("");
  const [step, setStep] = useState<"idle" | "signing" | "confirming">("idle");
  // const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Decrypted treasury balance
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const isError = !!writeError
  const isDone = isConfirmed

  const isValidAmount = 
    depositAmount.trim().length > 0 && !isNaN(parseFloat(depositAmount)) && 
    parseFloat(depositAmount) > 0

  async function handleDeposit() {
    if (!contractAddress || !isValidAmount) return

    setStep("signing")

    try {
      await mutateAsync({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "depositToTreasury",
        value: parseEther(depositAmount)
      })

      setStep("confirming")

    } catch (err) {
      console.log(err)
    }
  }

  async function handleDecryptTreasury() {
    if (!encryptedTreasuryHandle || !contractAddress) return;
    setDecrypting(true);
    try {
      const raw = await userDecrypt(encryptedTreasuryHandle, contractAddress);
      if (typeof raw === "bigint") {
        // Convert from wei to ETH, formatted to 6 decimal places
        const eth = Number(raw) / 1e18;
        setTreasuryBalance(eth.toFixed(6) + " ETH");
      } else {
        setTreasuryBalance(String(raw));
      }
    } catch {
      setTreasuryBalance("Decryption failed");
    } finally {
      setDecrypting(false);
    }
  }

  function handleCopyHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const recentDeposits = [
    { timestamp: "Awaiting on-chain data", title: "No recent deposits", description: "Fund the treasury to enable payroll" },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-h2 font-bold text-text-primary">Treasury Management</h1>
        <p className="text-text-secondary text-body mt-2">Manage ETH in the payroll treasury. Payroll draws from this balance.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Treasury Balance</p>
              <p className="text-body-sm text-text-tertiary">Encrypted on-chain — only visible to you</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EncryptedValueDisplay
            value="[ENCRYPTED]"
            decrypted={treasuryBalance ?? undefined}
            label="Current balance"
          />
          {encryptedTreasuryHandle && fhevmReady && !treasuryBalance && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 gap-2"
              onClick={handleDecryptTreasury}
              disabled={decrypting}
            >
              {decrypting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Decrypting…</>
                : "Decrypt Balance"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Deposit ETH</h2>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Error */}
          {isError && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
              <AlertCircle className="w-5 h-5 text-accent-red shrink-0" />
              <p className="text-body-sm text-accent-red">{writeError.message}</p>
            </div>
          )}

          {/* Done state */}
          {isDone && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-green/10 border border-accent-green/20">
                <CheckCircle className="w-5 h-5 text-accent-green" />
                <p className="text-body-sm text-accent-green font-medium">
                  Deposit confirmed — treasury funded with {depositAmount} ETH
                </p>
              </div>
              {txHash && (
                <div className="flex items-center gap-3">
                  <code className="flex-1 font-mono text-body-sm text-text-secondary bg-bg-tertiary p-2 rounded-lg truncate">
                    {txHash}
                  </code>
                  <button onClick={handleCopyHash} className="p-1.5 hover:bg-bg-tertiary rounded transition-colors">
                    <Copy className="w-4 h-4 text-text-tertiary" />
                  </button>
                </div>
              )}
              {copied && <p className="text-body-sm text-accent-green">Copied!</p>}
              <div className="flex gap-3">
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="secondary" fullWidth className="gap-2">
                      <ExternalLink className="w-4 h-4" /> View on Etherscan
                    </Button>
                  </a>
                )}
                <Button
                  variant="tertiary"
                  fullWidth
                  onClick={() => { setStep("idle"); setDepositAmount(""); }}
                >
                  Deposit More
                </Button>
              </div>
            </div>
          )}

          {/* Sending state */}
          {isPending || isConfirming && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
              <div className="space-y-1">
                <p className="text-body font-medium text-text-primary">
                  {step === "signing" ? "Waiting for wallet signature…" : "Confirming on Sepolia…"}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {step === "signing"
                    ? "Confirm the deposit in your wallet"
                    : `Depositing ${depositAmount} ETH — awaiting block confirmation`}
                </p>
              </div>
            </div>
          )}

          {/* Idle form */}
          {!isPending && !isConfirming && !isConfirmed && (
            <>
              <div className="space-y-2">
                <label className="text-body-sm text-text-secondary">Amount (ETH)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["0.1", "0.5", "1.0"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDepositAmount(preset)}
                    className="py-2 rounded-lg bg-bg-tertiary border border-border-light text-body-sm text-text-secondary hover:border-accent-purple/40 hover:text-text-primary transition-all"
                  >
                    {preset} ETH
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                fullWidth
                disabled={!isValidAmount || isPending}
                onClick={handleDeposit}
              >
                Deposit {depositAmount ? `${depositAmount} ETH` : "ETH"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Recent Activity</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentDeposits.map((item, i) => (
              <TimelineItem key={i} {...item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
