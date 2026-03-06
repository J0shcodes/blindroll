/**
 * contractConfig.ts
 *
 * Resolves the active Blindroll contract address with the following priority:
 *   1. URL search param  ?contract=0x...   (highest — employee deep links)
 *   2. localStorage key  blindroll:contractAddress
 *   3. NEXT_PUBLIC_CONTRACT_ADDRESS env var  (lowest — build-time default)
 *
 * The env var is the fallback so a single-org deploy (employer-only scenario)
 * still works without any localStorage writes. Employees set the address via
 * the /connect flow, which calls saveContractAddress().
 */

const LS_KEY = "blindroll:contractAddress"

/** Returns the contract address to use for the current session, or undefined. */
export function getContractAddress(): `0x${string}` | undefined {
    if (typeof window === "undefined") {
        return (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) || undefined
    }

    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("contract")
    if (fromUrl && isValidAddress(fromUrl)) {
        return fromUrl as `0x${string}`
    }

    try {
        const fromStorage = localStorage.getItem(LS_KEY)
        if (fromStorage && isValidAddress(fromStorage)) {
            return fromStorage as `0x${string}`
        }
    } catch {
        
    }

    const fromEnv = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (fromEnv && isValidAddress(fromEnv)) {
        return fromEnv as `0x${string}`
    }

    return undefined
}

/** Persists a contract address to localStorage for future sessions. */
export function saveContractAddress(address: string): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(LS_KEY, address.toLowerCase())
    } catch {
        console.warn("[contractConfig] Could not persist contract address")
    }
}

/** Clears the stored contract address (e.g. on disconnect). */
export function clearContractAddress(): void {
    if (typeof window === "undefined") return
    try {
        localStorage.removeItem(LS_KEY)
    } catch (error) {
        console.error(error)
    }
}

/** Basic 0x hex address validation — 42 chars, hex chars only. */
export function isValidAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}