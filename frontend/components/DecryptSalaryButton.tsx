"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { BLINDROLL_ABI } from "@/abi/abi";
import { useFhevm } from "@/hooks/useFhevm";
import { getContractAddress } from "@/lib/contractConfig";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import formatEth from "@/lib/formatEth";
import { useWallet } from "@/hooks/useWallet";

interface DecryptSalaryButtonProps {
  employeeAddress: `0x${string}`;
}

/**
 * Fetches an employee's salary handle via getEmployeeEncryptedSalary(),
 * then decrypts it client-side using the employer's wallet identity.
 *
 * The employer already has ACL access from _grantSalaryAccess() in the contract.
 * This component just provides the UI trigger for that decryption.
 */
export function DecryptSalaryButton({ employeeAddress }: DecryptSalaryButtonProps) {
  const contractAddress = getContractAddress();
  const { isReady: fhevmReady, userDecrypt } = useFhevm();

  const {address: walletAddress} = useWallet()

  const [salary, setSalary] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: salaryHandle, isLoading: handleLoading, error: encryptedSalaryError } = useReadContract({
    address: contractAddress,
    abi: BLINDROLL_ABI,
    functionName: "getEmployeeEncryptedSalary",
    args: [employeeAddress],
    query: { enabled: !!contractAddress },
    account: walletAddress
  });

  console.log(salaryHandle, `Encrypted Salary: ${encryptedSalaryError}`)

  async function handleDecrypt() {
    if (!salaryHandle || !contractAddress) return;
    setDecrypting(true);
    setError(null);

    try {
      const raw = await userDecrypt(salaryHandle as `0x${string}`, contractAddress);
      if (typeof raw === "bigint") {
        setSalary(formatEth(raw));
      } else {
        setError("Unexpected result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decvryption failed");
    } finally {
      setDecrypting(false);
    }
  }

  if (salary) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-body-sm font-medium text-accent-green">{salary}</span>
        <button
          onClick={() => setSalary(null)}
          className="p-1 rounded hover:bg-bg-tertiary transition-colors"
          title="Hide salary"
        >
          <EyeOff className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-accent-red flex-shrink-0" />
        <span className="text-caption text-accent-red">{error}</span>
        <button
          onClick={() => setError(null)}
          className="text-caption text-text-tertiary hover:text-text-secondary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (handleLoading) {
    return <span className="text-body-sm text-text-tertiary">Loading…</span>;
  }

  return (
    <button
      onClick={handleDecrypt}
      disabled={decrypting || !fhevmReady || !salaryHandle}
      className="flex items-center gap-1.5 text-body-sm text-accent-purple hover:text-accent-purple/80 
                 disabled:text-text-tertiary disabled:cursor-not-allowed transition-colors"
      title={!fhevmReady ? "Initializing FHE…" : "Decrypt salary"}
    >
      {decrypting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Decrypting…
        </>
      ) : (
        <>
          <Eye className="w-3.5 h-3.5" /> Decrypt
        </>
      )}
    </button>
  );
}
