/**
 * deploy.ts
 *
 * Exports the Blindroll contract bytecode and a typed deploy-args builder.
 *
 * IMPORTANT: After running `npx hardhat compile`, replace BLINDROLL_BYTECODE
 * with the real value from:
 *   artifacts/contracts/Blindroll.sol/Blindroll.json → bytecode field
 *
 * Usage in deploy/page.tsx:
 *   import { useDeployContract } from "wagmi"
 *   import { BLINDROLL_ABI } from "@/abi/abi"
 *   import { BLINDROLL_BYTECODE } from "@/lib/deploy"
 *
 *   const { deployContractAsync } = useDeployContract()
 *
 *   await deployContractAsync({
 *     abi: BLINDROLL_ABI,
 *     bytecode: BLINDROLL_BYTECODE,
 *   })
 */

/**
 * Blindroll contract bytecode.
 * Replace with the generated artifact bytecode after `npx hardhat compile`.
 */
export const BLINDROLL_BYTECODE =
  "0x" as `0x${string}`;

// ── Type guard ──────────────────────────────────────────────────────────────

/** Returns true if bytecode has been populated (not the placeholder "0x"). */
export function isBytecodeReady(): boolean {
  return BLINDROLL_BYTECODE.length > 2;
}