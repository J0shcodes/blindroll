"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useContract, ContractAddress } from "@/hooks/useContract";
import { useFhevm } from "@/hooks/useFhevm";
import { useWallet } from "@/hooks/useWallet";
import { BLINDROLL_ABI } from "@/abi/abi";
import {Loader2, CheckCircle, AlertCircle, Lock,} from "lucide-react";
import ModalShell from "../ui/ModalShell";

interface AddEmployeeModalProps {
    onClose: () => void
}

export default function AddEmployeeModal({onClose}: AddEmployeeModalProps) {
    const {address: walletAddress} = useWallet()
    const {contractAddress, mutateAsync, isPending, isConfirmed, txHash} = useContract()
    const {isReady: fhevmReady, encryptUint64, initError} = useFhevm()

    const [employeeAddress, setEmployeeAddress] = useState("");
    const [salaryInput, setSalaryInput] = useState("");
    const [step, setStep] = useState<"form" | "encrypting" | "signing" | "confirming" | "done" | "error">("form");
    const [errorMsg, setErrorMsg] = useState("");

    const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(employeeAddress.trim());
    const salaryWei = salaryInput ? BigInt(Math.round(parseFloat(salaryInput) * 1e18)) : 0n
    const canSubmit = isValidAddress && salaryWei > 0n && fhevmReady

    async function handleSubmit() {
      if (!contractAddress || !walletAddress) return
      setErrorMsg("")

        try {
            setStep("encrypting")
            const {handle, proof} = await encryptUint64(salaryWei, contractAddress, walletAddress)

            setStep("signing")
            await mutateAsync({
              address: contractAddress,
              abi: BLINDROLL_ABI,
              functionName: "addEmployee",
              args: [employeeAddress.trim() as ContractAddress, handle, proof]
            })

            setStep("confirming")
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : "Transaction failed")
            setStep("error")
        }
   }

    if (step === 'confirming' && isConfirmed) {
      return (
        <ModalShell onClose={onClose} title="">
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent-green" />
            </div>
            <div className="space-y-1">
                <p className="text-h3 font-semibold text-text-primary">Employee added</p>
                <p className="text-body-sm text-text-secondary">
                Salary encrypted and stored on-chain. The employee can now decrypt their own salary.
                </p>
            </div>
            {txHash && (
                <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-accent-purple hover:underline"
                >
                View transaction ↗
                </a>
            )}
            <Button variant="primary" fullWidth onClick={onClose}>Close</Button>
          </div>
        </ModalShell>
      )
    }

    if (step === "error") {
      return (
        <ModalShell onClose={onClose} title="Transaction failed">
            <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
                <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
                <p className="text-body-sm text-accent-red">{errorMsg}</p>
            </div>
            <Button variant="secondary" fullWidth onClick={() => setStep("form")}>Try Again</Button>
            </div>
        </ModalShell>
      );
    }

    if (step === "encrypting" || step === "signing" || step === "confirming") {
        const label = 
          step === "encrypting" ? "Encrypting salary locally..." :
          step === "signing" ? "Waiting for wallet signature" :
                               "Confirming on Sepolia"


        return (
            <ModalShell onClose={onClose} title="Adding employee">
                <div className="flex flex-col items-center gap-5 py-10">
                <Loader2 className="w-10 h-10 text-accent-purple animate-spin" />
                <div className="text-center space-y-1">
                    <p className="text-body font-medium text-text-primary">{label}</p>
                    {step === "encrypting" && (
                    <p className="text-body-sm text-text-secondary flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Salary never leaves your browser in plaintext
                    </p>
                    )}
                </div>
                </div>
            </ModalShell>
        );
    }

    return (
    <ModalShell onClose={onClose} title="Add Employee">
      <div className="space-y-5">
        {!fhevmReady && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
            <Loader2 className="w-4 h-4 text-accent-amber animate-spin" />
            <p className="text-body-sm text-accent-amber">
              {initError ?? "Initializing FHE encryption…"}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary">Employee wallet address</label>
          <Input
            placeholder="0x..."
            value={employeeAddress}
            onChange={(e) => setEmployeeAddress(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary">Monthly salary (ETH)</label>
          <Input
            type="number"
            placeholder="0.1"
            min="0"
            step="0.001"
            value={salaryInput}
            onChange={(e) => setSalaryInput(e.target.value)}
          />
          <p className="text-caption text-text-tertiary flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Encrypted with FHE before leaving this browser
          </p>
        </div>

        <div className="pt-2 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Employee"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

}