"use client"

import {useConnection, useDisconnect, useChainId} from "wagmi"
import {sepolia} from "@reown/appkit/networks"

export interface UseWalletReturn {
    address: `0x${string}` | undefined
    isConnected: boolean
    isConnecting: boolean
    isDisconnected: boolean
    chainId: number | undefined
    isCorrectNetwork: boolean
    disconnect: () => void
    shortAddress: string | undefined
}

export function useWallet(): UseWalletReturn {
    const {address, isConnected, isConnecting, isDisconnected} = useConnection()
    const {disconnect} = useDisconnect()

    const chainId = useChainId()

    const isCorrectNetwork= chainId === sepolia.id

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined

    return {
        address,
        isConnected,
        isConnecting,
        isDisconnected,
        chainId,
        isCorrectNetwork,
        disconnect,
        shortAddress
    }
    
}