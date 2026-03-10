"use client"

import { useMemo } from "react"
import { useWalletClient } from "wagmi"
import {BrowserProvider, JsonRpcSigner} from "ethers"
import type { WalletClient } from "viem"

/**
 * Converts a viem WalletClient to an ethers.js JsonRpcSigner.
 *
 * Uses JsonRpcSigner constructor directly (synchronous) rather than
 * provider.getSigner() (async) to avoid needing useEffect + useState.
 * Both produce an equivalent signer bound to the same address.
 */
function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
    const provider = new BrowserProvider(walletClient.transport as ConstructorParameters<typeof BrowserProvider>[0])
    const address = walletClient.account?.address

    return new JsonRpcSigner(provider, address!)
}

/**
 * Returns an ethers.js v6 JsonRpcSigner derived from the currently
 * connected wagmi wallet. Returns undefined when no wallet is connected.
 *
 * The signer is memoized and only re-derived when the wallet client
 * instance changes (account switch, network switch, or reconnect).
 */
export function useEtherSigner(): JsonRpcSigner | undefined {
    const {data: walletClient} = useWalletClient()

    return useMemo(() => {
        if (!walletClient) return undefined
        return walletClientToSigner(walletClient)
    }, [walletClient])
}

/**
 * Returns a callback that produces a fresh ethers signer on demand.
 * Use this inside onClick handlers where you need the signer at call
 * time rather than as stable component state.
 *
 * USAGE:
 *   const getEthersSigner = useGetEthersSigner();
 *
 *   const handleDecrypt = async () => {
 *     const signer = await getEthersSigner();
 *     if (!signer) return;
 *     const result = await instance.userDecryptEuint(..., signer);
 *   };
 */
export function useGetEthersSigner(): () => Promise<JsonRpcSigner | undefined> {
    const {data: walletClient} = useWalletClient()

    return useMemo(() => {
        return async (): Promise<JsonRpcSigner | undefined> => {
            if (!walletClient) return undefined

            const provider = new BrowserProvider(
                walletClient.transport as ConstructorParameters<typeof BrowserProvider>[0]
            )
            return provider.getSigner(walletClient.account.address)
        }
    }, [walletClient])
}