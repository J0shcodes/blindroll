"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDeployContract, useWaitForTransactionReceipt } from "wagmi";
import { useWallet } from "@/hooks/useWallet";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { Card, CardContent, } from "@/components/Card";
import { BLINDROLL_ABI } from "@/abi/abi";
import { BLINDROLL_BYTECODE, isBytecodeReady } from "@/lib/deploy";
import { saveContractAddress } from "@/lib/contractConfig";
import { 
    Rocket,
    CheckCircle,
    Copy,
    ExternalLink, 
    AlertCircle,
    Loader2,
    ShieldCheck,
    Lock,
    Zap
} from "lucide-react";

type DeployStep = "intro" | "deploying" | "confirming" | "done" | "error";

export default function DeployPage() {
    const router = useRouter()
    const {address, isConnected, shortAddress} = useWallet()
    const [copied, setCopied] = useState(false);

    const {mutateAsync, isPending: isDeploying, error: deployError} = useDeployContract()
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const {isLoading: isConfirming, isSuccess: isConfirmed, data: receipt} = useWaitForTransactionReceipt(
        {hash: txHash}
    )

    const savedRef = useRef(false)

    const deployStep: DeployStep = (() => {
        if (deployError) return "error"

        if (isConfirmed && receipt.contractAddress) {
            return "done"
        }

        if (isConfirming) return "confirming"

        if (isDeploying) return "deploying"

        return "intro"
    })()

    const deployedAddress = receipt?.contractAddress ?? ""

    useEffect(() => {
        if (!savedRef.current && receipt?.contractAddress) {
            saveContractAddress(receipt.contractAddress)
            savedRef.current = true;
        }
    }, [receipt])

    async function handleDeploy() {
        if (!isBytecodeReady()) {
            alert("Bytecode not found")
            return
        }

        try {
            const hash = await mutateAsync({
                abi: BLINDROLL_ABI,
                bytecode: BLINDROLL_BYTECODE
            })
            setTxHash(hash)
        } catch (error) {
            console.log("[deploy]", error)
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(deployedAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function handleGoToDashboard() {
        router.replace("/dashbord/emplyer")
    }

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col">
            <header className="h-16 border-b border-border-light flex items-center px-6">
                <Logo size="lg" showText />
                {isConnected && address && (
                    <span className="ml-auto font-mono text-body-sm text-text-tertiary">
                        {shortAddress}
                    </span>
                )}
            </header>

        <main className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-8">

            {deployStep === "intro" && (
                <>
                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
                        <Rocket className="w-7 h-7 text-accent-purple" />
                    </div>
                    </div>
                    <h1 className="text-h1 font-bold text-text-primary">Deploy your payroll</h1>
                    <p className="text-body text-text-secondary">
                    Deploy a Blindroll contract to Sepolia. You will be the employer, this wallet
                    address is permanently recorded in the contract.
                    </p>
                </div>

                <div className="space-y-3">
                    {[
                    { icon: <Lock className="w-4 h-4" />, text: "All salary data stays encrypted on-chain using Zama FHE" },
                    { icon: <ShieldCheck className="w-4 h-4" />, text: "Only you and each employee can view their own salary" },
                    { icon: <Zap className="w-4 h-4" />, text: "One-time deploy, add employees immediately after" },
                    ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-center gap-3 text-body-sm text-text-secondary">
                        <span className="text-accent-purple">{icon}</span>
                        {text}
                    </div>
                    ))}
                </div>

                <Card>
                    <CardContent className="space-y-3 py-4">
                    <p className="text-body-sm text-text-secondary">Deployer wallet (will become employer)</p>
                    <p className="font-mono text-body text-text-primary break-all">{address ?? "—"}</p>
                    </CardContent>
                </Card>

                {!isConnected && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
                    <AlertCircle className="w-5 h-5 text-accent-amber shrink-0" />
                    <p className="text-body-sm text-accent-amber">Connect your wallet before deploying.</p>
                    </div>
                )}

                <Button
                    variant="primary"
                    fullWidth
                    disabled={!isConnected || !isBytecodeReady()}
                    onClick={handleDeploy}
                >
                    Deploy Blindroll Contract
                </Button>

                {!isBytecodeReady() && (
                    <p className="text-body-sm text-text-tertiary text-center">
                    Bytecode not yet compiled — run <code className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded">npx hardhat compile</code> first
                    </p>
                )}
                </>
            )}

            {deployStep === "deploying" && (
                <Card>
                <CardContent className="py-16 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="w-10 h-10 text-accent-purple animate-spin" />
                    <div className="space-y-1">
                        <p className="text-body font-semibold text-text-primary">Waiting for wallet signature…</p>
                        <p className="text-body-sm text-text-secondary">Confirm the deployment transaction in your wallet</p>
                    </div>
                    </div>
                </CardContent>
                </Card>
            )}

            {deployStep === "confirming" && (
                <Card>
                <CardContent className="py-16 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="w-10 h-10 text-accent-purple animate-spin" />
                    <div className="space-y-1">
                        <p className="text-body font-semibold text-text-primary">Confirming on Sepolia…</p>
                        <p className="text-body-sm text-text-secondary">
                        Transaction submitted — waiting for block confirmation
                        </p>
                    </div>
                    {txHash && (
                        <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-body-sm text-accent-purple hover:underline"
                        >
                        View on Etherscan <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                    </div>
                </CardContent>
                </Card>
            )}

            {deployStep === "done" && (
                <>
                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent-green/10 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-accent-green" />
                    </div>
                    </div>
                    <h1 className="text-h1 font-bold text-text-primary">Contract deployed!</h1>
                    <p className="text-body text-text-secondary">
                    Your Blindroll payroll contract is live on Sepolia. Share the address below with
                    your employees.
                    </p>
                </div>

                <Card>
                    <CardContent className="space-y-4 py-5">
                    <p className="text-body-sm text-text-secondary">Contract address</p>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 font-mono text-body-sm text-text-primary bg-bg-tertiary p-3 rounded-lg break-all">
                        {deployedAddress}
                        </code>
                        <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors shrink-0"
                        title="Copy address"
                        >
                        <Copy className="w-4 h-4 text-text-secondary" />
                        </button>
                    </div>
                    {copied && (
                        <p className="text-body-sm text-accent-green">Copied!</p>
                    )}
                    <a
                        href={`https://sepolia.etherscan.io/address/${deployedAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-body-sm text-accent-purple hover:underline"
                    >
                        View on Etherscan <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    </CardContent>
                </Card>

                <div className="space-y-2">
                    <Button variant="primary" fullWidth onClick={handleGoToDashboard}>
                    Go to Employer Dashboard
                    </Button>
                    <p className="text-body-sm text-text-tertiary text-center">
                    Fund the treasury from the dashboard before running payroll
                    </p>
                </div>
                </>
            )}

            {deployStep === "error" && (
                <Card>
                <CardContent className="py-10 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-accent-red" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-body font-semibold text-text-primary">Deployment failed</p>
                        <p className="text-body-sm text-text-secondary">
                        {deployError?.message ?? "Unknown error. Check your wallet and Sepolia balance."}
                        </p>
                    </div>
                    </div>
                    <Button variant="secondary" fullWidth onClick={() => window.location.reload()}>
                    Try Again
                    </Button>
                </CardContent>
                </Card>
            )}

            </div>
        </main>
        </div>
  );
}