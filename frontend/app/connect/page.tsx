"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppKit } from "@reown/appkit/react"
import { useWallet } from "@/hooks/useWallet"
import { useContract } from "@/hooks/useContract"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/Button"
import { Card, CardContent } from "@/components/Card"
import { Input } from "@/components/Input"
import { Shield, Users, Briefcase, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { saveContractAddress, isValidAddress } from "@/lib/contractConfig"

type Step = "role" | "connect" | "contract-input" | "verifying" | "ready";
type Role = "employer" | "employee";

export default function ConnectPage() {
    const router = useRouter()
    const {open} = useAppKit()
    const {isConnected, isConnecting, isCorrectNetwork} = useWallet()
    const {isEmployer, isEmployee, isRoleLoading, isConfigured} = useContract()

    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    // const [step, setStep] = useState<Step>("role");
    const [contractInput, setContractInput] = useState("");
    const [contractError, setContractError] = useState("");
    // const [networkError, setNetworkError] = useState(false);

    const networkError = !!isConnected && !!selectedRole && !isCorrectNetwork;

    const currentStep: Step = (() => {
        if (!selectedRole) return "role"

        if (!isConnected) return "connect"

        if (!isCorrectNetwork) return "connect";

        if (selectedRole === "employee" && !isConfigured) {
            return "contract-input";
        }

        if (isRoleLoading) return "verifying"

        return "ready"
    })()

   useEffect(() => {
    if (currentStep !== "ready") return;
    if (!selectedRole) return;

    if (selectedRole === "employer") {
      if (isEmployer) {
        router.replace("/dashboard/employer");
      } else {
        router.replace("/deploy");
      }
    }

    if (selectedRole === "employee" && isEmployee) {
      router.replace("/dashboard/employee");
    }
  }, [
    currentStep,
    selectedRole,
    isEmployer,
    isEmployee,
    router,
  ]); 

    function handleRoleSelect(role: Role) {
        setSelectedRole(role)
    }

    function handleConnectWallet() {
      open()
    }

    function handleContractSubmit() {
        setContractError("")
        if (!isValidAddress(contractInput.trim())) {
            setContractError("Invalid address — must be a 42-character 0x hex string")
            return
        }
        saveContractAddress(contractInput.trim())
    }

    function resetToRoleSelection() {
      setSelectedRole(null)
      setContractInput("")
      setContractError("")
    }

    return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <header className="h-16 border-b border-border-light flex items-center px-6">
        <Logo size="lg" showText />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-8">

          {/* ── Step: Choose role ─────────────────────────────────────── */}
          {currentStep === "role" && (
            <>
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-accent-purple" />
                  </div>
                </div>
                <h1 className="text-h1 font-bold text-text-primary">Welcome to Blindroll</h1>
                <p className="text-body text-text-secondary">
                  Confidential onchain payroll; salaries stay private, powered by FHE.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RoleCard
                  icon={<Briefcase className="w-6 h-6 text-accent-purple" />}
                  title="I'm an Employer"
                  description="Deploy a payroll contract, add employees, and run confidential payroll"
                  onClick={() => handleRoleSelect("employer")}
                />
                <RoleCard
                  icon={<Users className="w-6 h-6 text-accent-purple" />}
                  title="I'm an Employee"
                  description="View your encrypted salary and withdraw your accumulated balance"
                  onClick={() => handleRoleSelect("employee")}
                />
              </div>
            </>
          )}

          {/* ── Step: Connect wallet ──────────────────────────────────── */}
          {currentStep === "connect" && (
            <Card>
              <CardContent className="space-y-6 py-8">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                      {selectedRole === "employer"
                        ? <Briefcase className="w-6 h-6 text-accent-purple" />
                        : <Users className="w-6 h-6 text-accent-purple" />}
                    </div>
                  </div>
                  <h2 className="text-h2 font-bold text-text-primary">Connect your wallet</h2>
                  <p className="text-body text-text-secondary">
                    {selectedRole === "employer"
                      ? "Connect the wallet you used to deploy Blindroll — it will be recognized as the employer."
                      : "Connect the wallet your employer registered on the contract."}
                  </p>
                </div>

                {networkError && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
                    <AlertCircle className="w-5 h-5 text-accent-red shrink-0" />
                    <p className="text-body-sm text-accent-red">
                      Wrong network. Please switch to <strong>Sepolia</strong> in your wallet.
                    </p>
                  </div>
                )}

                {isConnecting ? (
                  <div className="flex items-center justify-center gap-3 py-2 text-text-secondary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-body">Connecting…</span>
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-green/10 border border-accent-green/20">
                    <CheckCircle2 className="w-5 h-5 text-accent-green" />
                    <p className="text-body-sm text-accent-green font-medium">Wallet connected</p>
                  </div>
                ) : (
                  <Button variant="primary" fullWidth onClick={handleConnectWallet}>
                    Connect Wallet
                  </Button>
                )}

                <button
                  onClick={resetToRoleSelection}
                  className="w-full text-body-sm text-text-tertiary hover:text-text-secondary transition-colors text-center"
                >
                  ← Back
                </button>
              </CardContent>
            </Card>
          )}

          {/* ── Step: Employee contract address input ─────────────────── */}
          {currentStep === "contract-input" && (
            <Card>
              <CardContent className="space-y-6 py-8">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent-purple" />
                    </div>
                  </div>
                  <h2 className="text-h2 font-bold text-text-primary">Enter contract address</h2>
                  <p className="text-body text-text-secondary">
                    Ask your employer for the Blindroll contract address and paste it below.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-body-sm text-text-secondary">Contract address</label>
                  <Input
                    placeholder="0x..."
                    value={contractInput}
                    onChange={(e) => {
                      setContractInput(e.target.value);
                      setContractError("");
                    }}
                    className="font-mono"
                  />
                  {contractError && (
                    <p className="text-body-sm text-accent-red flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {contractError}
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleContractSubmit}
                  disabled={!contractInput.trim()}
                >
                  Continue
                </Button>

                <button
                  onClick={resetToRoleSelection}
                  className="w-full text-body-sm text-text-tertiary hover:text-text-secondary transition-colors text-center"
                >
                  ← Back
                </button>
              </CardContent>
            </Card>
          )}

          {/* ── Step: Verifying role on-chain ─────────────────────────── */}
          {(currentStep === "verifying" || currentStep === "ready") && (
            <Card>
              <CardContent className="py-12 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  {isRoleLoading ? (
                    <>
                      <Loader2 className="w-10 h-10 text-accent-purple animate-spin" />
                      <div className="text-center space-y-1">
                        <p className="text-body font-medium text-text-primary">Verifying on-chain role…</p>
                        <p className="text-body-sm text-text-secondary">Reading contract state from Sepolia</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-accent-green" />
                      <p className="text-body font-medium text-text-primary">Redirecting you now…</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function RoleCard({ icon, title, description, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="text-left card hover:border-accent-purple/40 hover:bg-bg-tertiary transition-all group focus-ring rounded-lg"
    >
      <div className="space-y-3">
        <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-body font-semibold text-text-primary">{title}</p>
          <p className="text-body-sm text-text-secondary">{description}</p>
        </div>
        <p className="text-body-sm text-accent-purple font-medium">Get started →</p>
      </div>
    </button>
  );


}