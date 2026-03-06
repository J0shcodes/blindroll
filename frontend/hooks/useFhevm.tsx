"use client";

import { useState, useEffect, useCallback, useRef } from "react";
// import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import { Eip1193Provider } from "ethers";
import { useGetEthersSigner } from "./useEthersSigner";
import { useWallet } from "./useWallet";
import { TypedDataField } from "ethers";

/**
 * Converts a Uint8Array to a 0x-prefixed hex string.
 * The relayer SDK returns handles and inputProof as Uint8Array — contracts
 * expect them as bytes32 / bytes hex strings.
 */
function uint8ArrayToHex(bytes: Uint8Array): `0x${string}` {
  return ("0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;
}

export interface EncryptedInput {
  handle: `0x${string}`;
  proof: `0x${string}`;
}

export interface UseFhevmReturn {
  isReady: boolean;
  initError: string | undefined;

  /**
   * Encrypts a uint64 value using the fhEVM SDK.
   * Produces a ciphertext handle + ZK proof bound to the given contract + caller.
   *
   * USAGE (employer setting a salary):
   *   const { handle, proof } = await encryptUint64(
   *     BigInt(5_000_000_000),   // salary as bigint
   *     contractAddress,
   *     employerAddress          // connected wallet address
   *   );
   *   await writeContractAsync({
   *     functionName: "addEmployee",
   *     args: [employeeAddress, handle, proof],
   *   });
   */
  encryptUint64: (
    value: bigint,
    contractAddress: string,
    signerAddress: string
  ) => Promise<EncryptedInput>;

  /**
   * User-decrypts a ciphertext handle using the connected wallet's identity.
   *
   * Triggers a wallet signature request (no gas, no transaction — just a
   * message signing prompt). The signature proves to the Zama KMS that the
   * caller is who they claim to be. The KMS checks the ACL and, if permission
   * exists, re-encrypts the value under the user's ephemeral public key and
   * returns the cleartext.
   *
   * Returns the decrypted value (bigint for euint64/euint8, boolean for ebool),
   * or null if decryption fails (e.g. ACL denied, wallet rejected signature).
   *
   * USAGE (employee viewing their salary):
   *   const salary = await userDecrypt(salaryHandle, contractAddress);
   *   // salary → 5000000000n (bigint)
   */
  userDecrypt: (
    handle: `0x${string}`,
    contractAddress: string
  ) => Promise<bigint | boolean | string | null>;
}

export function useFhevm(): UseFhevmReturn {
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | undefined>(undefined);

  // Guard against double-init in React 18 StrictMode dev double-invoke
  const initAttempted = useRef(false);

  const { isConnected, isCorrectNetwork } = useWallet();
  const getEthersSigner = useGetEthersSigner();

  // ── Initialize fhEVM instance ─────────────────────────────────────────────
  //
  // Two required steps:
  //   1. initSDK() — loads the TFHE WASM binary (one-time global operation)
  //   2. createInstance(config) — connects to Zama relayer, fetches FHE public key
  //
  // SepoliaConfig is the built-in preset from the SDK. We spread it and
  // override `network` with window.ethereum so the SDK routes RPC calls
  // through the user's connected wallet provider.
  //
  // Full SepoliaConfig equivalent:
  //   aclContractAddress:                    0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D
  //   kmsContractAddress:                    0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A
  //   inputVerifierContractAddress:          0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0
  //   verifyingContractAddressDecryption:    0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478
  //   verifyingContractAddressInputVerification: 0x483b9dE06E4E4C7D35CCf5837A1668487406D955
  //   chainId:        11155111  (Sepolia)
  //   gatewayChainId: 10901
  //   relayerUrl:     https://relayer.testnet.zama.org
  useEffect(() => {
    const cancelled = false

    const init = async () => {

      if (!isConnected || !isCorrectNetwork) {
        if (!cancelled) {
          setIsReady(false);
          setInstance(undefined);
        }
        return;
      }

      if (initAttempted.current) return;
      initAttempted.current = true;

      try {
        const sdk = await import("@zama-fhe/relayer-sdk/bundle")
        
        const {initSDK, createInstance, SepoliaConfig} = sdk
        
        // Load WASM — must complete before createInstance is called
        await initSDK();

        if (cancelled) return

        // Create instance
        // Override `network` with window.ethereum when available so the SDK
        // uses the user's wallet provider for any RPC reads it needs to do.
        const config = {
          ...SepoliaConfig,
          network:
            typeof window !== "undefined" && window.ethereum
              ? (window.ethereum as unknown as Eip1193Provider)
              : "https://rpc.ankr.com/eth_sepolia",
        };

        const fhevmInstance = await createInstance(config);

        if (!cancelled) {
          setInstance(fhevmInstance);
          setIsReady(true);
          setInitError(undefined);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "fhEVM initialization failed";
          console.error("[useFhevm] init failed:", err);
          setInitError(message);
          setIsReady(false);
        }
      }
    };

    init();

    return () => {
      // Reset the guard on wallet disconnect/network change so
      // re-initialization can happen when the user reconnects
      initAttempted.current = false;
    };
  }, [isConnected, isCorrectNetwork]);

  // ── encryptUint64 ─────────────────────────────────────────────────────────
  //
  // Encrypts a bigint as euint64, bound to a specific (contract, caller) pair.
  // The ZK proof that comes back is what FHE.isSenderAllowed() verifies on-chain.
  const encryptUint64 = useCallback(
    async (
      value: bigint,
      contractAddress: string,
      signerAddress: string
    ): Promise<EncryptedInput> => {
      if (!instance || !isReady) {
        throw new Error("fhEVM instance not ready. Wait for isReady = true.");
      }

      const buffer = instance.createEncryptedInput(contractAddress, signerAddress);
      buffer.add64(value);

      // encrypt() performs local FHE encryption + generates ZK proof of knowledge,
      // then uploads ciphertexts to the relayer
      const ciphertexts = await buffer.encrypt();

      return {
        handle: uint8ArrayToHex(ciphertexts.handles[0]) as `0x${string}`,
        proof: uint8ArrayToHex(ciphertexts.inputProof) as `0x${string}`,
      };
    },
    [instance, isReady]
  );

  const userDecrypt = useCallback(
    async (
      handle: `0x${string}`,
      contractAddress: string
    ): Promise<bigint | boolean | string | null> => {
      if (!instance || !isReady) {
        throw new Error("fhEVM instance not ready.");
      }

      const signer = await getEthersSigner();
      if (!signer) {
        throw new Error("No wallet connected. Connect your wallet to decrypt.");
      }

      try {
        // Step 1: Generate an ephemeral NaCl keypair for this decrypt session
        const keypair = instance.generateKeypair();

        // Step 2: Build EIP-712 typed data structure
        // 10 days gives enough viewing window without granting indefinite
        // access to the ephemeral session keypair
        const startTimeStamp = Math.floor(Date.now() / 1000);
        const durationDays = 10;
        const contractAddresses = [contractAddress];

        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimeStamp,
          durationDays
        );

        // Step 3: Wallet signature — prompts the user (no gas, no transaction)
        const signature = await signer.signTypedData(
          eip712.domain,
          {
            UserDecryptRequestVerification:
              [...eip712.types.UserDecryptRequestVerification,] as TypedDataField[]
          },
          eip712.message
        );

        const handleContractPairs = [{ handle, contractAddress }];

        const result = await instance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace("0x", ""), // SDK expects signature without 0x prefix
          contractAddresses,
          signer.address,
          startTimeStamp,
          durationDays
        );

        // result is a map of handle → decrypted value (bigint | boolean | string)
        return result[handle] ?? null;
      } catch (err) {
        console.error("[useFhevm] userDecrypt failed:", err);
        return null;
      }
    },
    [instance, isReady, getEthersSigner]
  );

  return {
    isReady,
    initError,
    encryptUint64,
    userDecrypt,
  };
}

export const ERROR_MESSAGES: Record<number, string> = {
  0: "No error",
  1: "Insufficient treasury balance — payroll could not be processed",
  2: "No balance to withdraw",
  3: "Employee is not active",
};

export function getErrorMessage(
  errorCode: bigint | boolean | string | null
): string {
  if (errorCode === null) return "Could not read error status";
  if (typeof errorCode === "bigint") {
    return (
      ERROR_MESSAGES[Number(errorCode)] ?? `Unknown error code: ${errorCode}`
    );
  }
  return "Unexpected error code format";
}