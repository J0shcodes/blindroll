"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { EncryptedValueDisplay } from "@/components/EncryptedValueDisplay";
import { TimelineItem } from "@/components/TimelineItem";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { useFhevm } from "@/hooks/useFhevm";
import { BLINDROLL_ABI } from "@/abi/abi";
import { Download, AlertCircle, CheckCircle, ExternalLink, Loader2, Eye, Copy, Lock } from "lucide-react";
import formatEth from "@/lib/formatEth";

export default function BalancePage() {
  const publicClient = usePublicClient()
  const { address: walletAddress } = useWallet();
  const {
    contractAddress,
    encryptedBalanceHandle,
    mutateAsync,
    isPending,
    isConfirmed,
    isConfirming,
    txHash,
    writeError,
    reset,
  } = useContract();

  const { isReady: fhevmReady, userDecrypt, publicDecrypt } = useFhevm();

  const [balance, setBalance] = useState<string | null>(null);
  const [decryptingBalance, setDecryptingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [step, setStep] = useState<"idle" | "requesting" | "proving" | "executing" | "completed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isError = !!writeError;

  async function handleDecryptBalance() {
    if (!encryptedBalanceHandle || !contractAddress || !walletAddress) return;
    setDecryptingBalance(true);
    setBalanceError(null);

    try {
      const raw = await userDecrypt(encryptedBalanceHandle, contractAddress);
      if (typeof raw === "bigint") {
        setBalance(formatEth(raw));
      } else {
        setBalanceError("Unexpected decryption result");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDecryptingBalance(false);
    }
  }

  const sleep = (ms: number) => new Promise((resolve) => resolve(setTimeout(resolve, ms)));

  async function handleWithdraw() {
    if (!contractAddress || !walletAddress || !encryptedBalanceHandle) return;
    setError(null);

    try {
      console.log("Step 1: Requesting withdrawal on-chain...");
      setStep("requesting");
      const hash = await mutateAsync({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "requestWithdrawal",
      });

      console.log("Waiting for transaction to be mined...", hash);
      await publicClient?.waitForTransactionReceipt({hash, confirmations: 1})
      console.log("Transaction mined!");

      reset();

      console.log("Step 2: Waiting for Relayer indexing (5s)...");
      setStep("proving");
      await sleep(10000);

      console.log("Step 3: Fetching public decryption proof...");
      const results = await publicDecrypt([encryptedBalanceHandle]);

      const decryptedAmount = results.clearValues[encryptedBalanceHandle];
      const decryptionProof = results.decryptionProof;

      if (typeof decryptedAmount !== "bigint") {
        throw new Error("Decrypted amount is not a valid integer");
      }

      console.log("Executing");
      setStep("executing");
      await mutateAsync({
        address: contractAddress,
        abi: BLINDROLL_ABI,
        functionName: "executeWithdraw",
        args: [decryptedAmount, decryptionProof],
      });
      setStep("completed")
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setError(error instanceof Error ? error.message : "An error occurred during withdrawal");
      setStep("idle");
    }
  }

  function handleCopyHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const withdrawalHistory = [
    {
      timestamp: "On-chain event indexing not yet implemented",
      title: "Withdrawal history",
      description: "Previous withdrawals will appear here once event indexing is added",
    },
  ];

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
            <h1 className="text-h1 font-bold text-text-primary">Withdrawal Complete</h1>
            <p className="text-body text-text-secondary">Your full balance has been sent to your wallet.</p>
          </div>

          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 space-y-4 text-left">
            {txHash && (
              <>
                <div className="space-y-2">
                  <p className="text-body-sm text-text-secondary">Transaction Hash</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 font-mono text-body-sm text-text-primary bg-bg-tertiary p-3 rounded-lg break-all">
                      {txHash}
                    </code>
                    <button onClick={handleCopyHash} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                      <Copy className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                  {copied && <p className="text-body-sm text-accent-green">Copied!</p>}
                </div>
              </>
            )}

            <div className="pt-4 border-t border-border-light space-y-4">
              {txHash || step === "completed" && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" fullWidth className="gap-2">
                    <ExternalLink className="w-4 h-4" /> View on Etherscan
                  </Button>
                </a>
              )}
              <Button
                variant="tertiary"
                className="bg-red-500"
                fullWidth
                onClick={() => {
                  setStep("idle");
                  setBalance(null);
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

  if (step !== "idle") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-accent-purple animate-spin" />
              <div className="space-y-1">
                <p className="text-body font-semibold text-text-primary">
                  {step === "requesting" && "Phase 1: Authorizing Decryption..."}
                  {step === "proving" && "Phase 2: Generating Security Proof..."}
                  {step === "executing" && "Phase 3: Transferring ETH..."}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {step === "requesting" && "Confirm the request in your wallet."}
                  {step === "proving" && "The Relayer is verifying your balance off-chain."}
                  {step === "executing" && "Finalizing the transaction on Sepolia."}
                </p>
              </div>
              {step === "executing" && txHash && (
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
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-h2 font-bold text-text-primary">My Balance</h1>
        <p className="text-text-secondary text-body mt-1">View and withdraw your accumulated payroll balance.</p>
      </div>

      {/* Error banner */}
      {isError || error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
          <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-accent-red">Withdrawal failed</p>
            <p className="text-body-sm text-accent-red/80">{error}</p>
          </div>
        </div>
      )}

      {/* Balance card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-h3 font-semibold text-text-primary">Available Balance</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <EncryptedValueDisplay value="[ENCRYPTED]" decrypted={balance ?? undefined} label="Balance (ETH)" />

          {balanceError && (
            <p className="text-body-sm text-accent-red flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {balanceError}
            </p>
          )}

          {!balance && encryptedBalanceHandle && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleDecryptBalance}
              disabled={decryptingBalance || !fhevmReady}
            >
              {decryptingBalance ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Decrypting…
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" /> Decrypt Balance
                </>
              )}
            </Button>
          )}

          <p className="text-caption text-text-tertiary flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Your balance is encrypted on-chain — only you can decrypt it
          </p>
        </CardContent>
      </Card>

      {/* Withdraw card */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-text-primary">Withdraw</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-body text-text-secondary">
            Withdraw your full accumulated balance to your connected wallet. This sends all accrued ETH in a single
            transaction.
          </p>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-tertiary border border-border-light">
            <Download className="w-5 h-5 text-accent-purple shrink-0" />
            <div>
              <p className="text-body-sm font-medium text-text-primary">Full balance withdrawal</p>
              <p className="text-body-sm text-text-secondary">100% of your balance will be sent to your wallet</p>
            </div>
          </div>

          <Button variant="primary" fullWidth onClick={handleWithdraw} disabled={isPending || !contractAddress}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing…
              </>
            ) : (
              "Withdraw Balance"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-h3 font-semibold text-text-primary">Withdrawal History</h2>
          <div className="space-y-2">
            {withdrawalHistory.map((item, i) => (
              <TimelineItem key={i} {...item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
