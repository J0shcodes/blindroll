"use client";

import { useState } from "react";
import { useFhevm } from "@/hooks/useFhevm";
import { useContract } from "@/hooks/useContract";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function TreasuryDecryptInline() {
  const { contractAddress, encryptedTreasuryHandle } = useContract();
  const { isReady: fhevmReady, userDecrypt } = useFhevm();

  const [balance, setBalance] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDecrypt() {
    if (!encryptedTreasuryHandle || !contractAddress) return;
    setDecrypting(true);
    setError(null);

    try {
      const raw = await userDecrypt(encryptedTreasuryHandle, contractAddress);
      if (typeof raw === "bigint") {
        const eth = Number(raw) / 1e18;
        setBalance(eth.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 }) + " ETH");
      } else {
        setError("Unexpected result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setDecrypting(false);
    }
  }

  if (balance) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span className="text-body-sm font-semibold text-accent-green">{balance}</span>
        <button
          onClick={() => setBalance(null)}
          className="p-1 rounded hover:bg-bg-tertiary transition-colors"
          title="Hide balance"
        >
          <EyeOff className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 space-y-1">
      <button
        onClick={handleDecrypt}
        disabled={decrypting || !fhevmReady || !encryptedTreasuryHandle}
        className="flex items-center gap-1.5 text-body-sm text-accent-purple hover:text-accent-purple/80
                   disabled:text-text-tertiary disabled:cursor-not-allowed transition-colors"
      >
        {decrypting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Decrypting…
          </>
        ) : !fhevmReady ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Initializing FHE…
          </>
        ) : !encryptedTreasuryHandle ? (
          <span className="text-text-tertiary">No treasury yet</span>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" /> Decrypt balance
          </>
        )}
      </button>
      {error && (
        <p className="text-caption text-accent-red flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
