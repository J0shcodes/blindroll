"use client"

import { useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "../Button"
import { ContractAddress, useContract } from "@/hooks/useContract"

import ModalShell from "../ui/ModalShell"
import { BLINDROLL_ABI } from "@/abi/abi"

interface RemoveEmployeeModalProps {
    address: string
    onClose: () => void
}

export default function RemoveEmployeeModal({address: employeeAddress, onClose}: RemoveEmployeeModalProps) {
    const {contractAddress, mutateAsync, isPending, isConfirmed} = useContract()
    const [step, setStep] = useState<"confirm" | "pending" | "done" | "error">("confirm");
    const [errorMsg, setErrorMsg] = useState("");

    if (step === "done" || isConfirmed) {
      return (
        <ModalShell onClose={onClose} title="">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle className="w-10 h-10 text-accent-green" />
            <p className="text-body font-medium text-text-primary">Employee removed</p>
            <Button variant="primary" fullWidth onClick={onClose}>Close</Button>
          </div>
        </ModalShell>
      )
    }

    async function handleRemove() {
        if (!contractAddress) return
        setStep("pending")

        try {
            await mutateAsync({
                address: contractAddress,
                abi: BLINDROLL_ABI,
                functionName: "removeEmployee",
                args: [employeeAddress as ContractAddress]
            })
            setStep("done")
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : "Transaction failed")
            setStep("error")
        }
      }

    return (
    <ModalShell onClose={onClose} title="Remove Employee">
      <div className="space-y-5">
        <p className="text-body text-text-secondary">
          This will mark the employee as inactive. They will no longer receive payroll. This action
          can&apos;t be undone on-chain.
        </p>
        <p className="font-mono text-body-sm text-text-primary bg-bg-tertiary p-3 rounded-lg break-all">
          {employeeAddress}
        </p>
        {step === "error" && (
          <p className="text-body-sm text-accent-red">{errorMsg}</p>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            fullWidth
            disabled={step === "pending" || isPending}
            onClick={handleRemove}
            className="bg-accent-red hover:bg-accent-red/90"
          >
            {step === "pending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}