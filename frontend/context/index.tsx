"use client"

import { wagmiAdapter, projectId } from "@/config";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {createAppKit} from "@reown/appkit/react"
import {sepolia} from "@reown/appkit/networks"
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const metadata = {
    name: "Blindroll", 
    description: "Confidential onchain payroll using Fully Homomorphic Encryption. Pay your team on Ethereum; individual salaries stay completely private, encrypted end-to-end with Zama's fhEVM.",
    url: "",
    icons: [""]
}

const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [sepolia],
    defaultNetwork: sepolia,
    metadata: metadata
})

function ContextProvider({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider