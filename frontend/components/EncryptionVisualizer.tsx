"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface AccessControl {
  actor: string;
  read: boolean;
  write: boolean;
}

const ENCRYPTION_STATES = [
  {
    state: "plaintext" as const,
    duration: 2000,
  },
  {
    state: "encrypting" as const,
    duration: 800,
  },
  {
    state: "encrypted" as const,
    duration: 2000,
  },
];

export function EncryptionVisualizer() {
  const [currentStateIdx, setCurrentStateIdx] = useState(0);

  useEffect(() => {
    const durations = ENCRYPTION_STATES.map((s) => s.duration);
    const totalCycle = durations.reduce((a, b) => a + b, 0);

    const interval = setInterval(() => {
      setCurrentStateIdx((prev) => (prev + 1) % ENCRYPTION_STATES.length);
    }, ENCRYPTION_STATES[currentStateIdx].duration);

    return () => clearInterval(interval);
  }, [currentStateIdx]);

  const currentState = ENCRYPTION_STATES[currentStateIdx].state;

  const accessControl: AccessControl[] = [
    { actor: "Employer", read: true, write: true },
    { actor: "Employee", read: true, write: false },
    { actor: "Public", read: false, write: false },
  ];

  return (
    <div className="w-full space-y-6">
      <AnimatePresence mode="wait">
        {currentState === "plaintext" && (
          <motion.div
            key="plaintext"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="block text-body-sm font-medium text-text-secondary">Salary Input</label>
              <div className="bg-bg-tertiary border border-border-light rounded-lg p-4">
                <input
                  type="text"
                  value="$8,500.00 / month"
                  readOnly
                  className="w-full bg-transparent font-mono text-h2 text-text-primary outline-none"
                />
              </div>
            </div>
            <p className="text-text-secondary text-body-sm">What the employer enters</p>
          </motion.div>
        )}

        {currentState === "encrypting" && (
          <motion.div
            key="encrypting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="block text-body-sm font-medium text-text-secondary">Encryption in progress...</label>
              <div className="bg-bg-tertiary border border-border-light rounded-lg p-4 space-y-3">
                {/* Animated character transformation */}
                <div className="flex gap-1 flex-wrap font-mono text-body">
                  {["$", "8", ",", "5", "0", "0", ".", "0", "0"].map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 1, color: "#F0F0F5" }}
                      animate={{ opacity: 0.3, color: "#6C3BDE" }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                  <span className="text-accent-purple">...</span>
                </div>

                {/* Progress bar */}
                <motion.div
                  className="h-1 bg-accent-purple rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </div>
            </div>
            <p className="text-text-secondary text-body-sm">fhEVM encrypting client-side...</p>
          </motion.div>
        )}

        {currentState === "encrypted" && (
          <motion.div
            key="encrypted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <label className="block text-body-sm font-medium text-text-secondary">Encrypted on-chain</label>

              {/* Ciphertext display */}
              <div className="bg-bg-tertiary border border-border-light rounded-lg p-4">
                <p className="font-mono text-body-sm text-accent-green break-all">
                  0x7f3a2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
                </p>
                <p className="text-text-tertiary text-caption mt-2">[ENCRYPTED — euint64]</p>
              </div>

              {/* Access control matrix */}
              <div className="space-y-2">
                <p className="text-body-sm font-medium text-text-secondary">Access Control</p>
                <div className="bg-bg-tertiary border border-border-light rounded-lg overflow-hidden">
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="text-left px-4 py-2 text-text-secondary">Actor</th>
                        <th className="text-center px-4 py-2 text-text-secondary">Read</th>
                        <th className="text-center px-4 py-2 text-text-secondary">Write</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessControl.map((row, idx) => (
                        <tr key={idx} className="border-t border-border-light hover:bg-bg-secondary">
                          <td className="px-4 py-2 text-text-primary">{row.actor}</td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={cn(
                                "inline-block w-2 h-2 rounded-full",
                                row.read ? "bg-accent-green" : "bg-border-medium",
                              )}
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={cn(
                                "inline-block w-2 h-2 rounded-full",
                                row.write ? "bg-accent-green" : "bg-border-medium",
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="text-text-secondary text-body-sm">What&apos;s stored on Ethereum</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
