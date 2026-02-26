import React from 'react'
import { Card } from '@/components/Card'

export function HowItWorksSection() {
  return (
    <section className="py-20 border-t border-border-light">
      <div className="container-safe w-full space-y-20">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-h1 font-bold text-text-primary">How It Works</h2>
          <p className="text-body text-text-secondary">
            Blindroll uses confidential computing to keep salaries encrypted end-to-end
          </p>
        </div>

        {/* Step 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 order-2 lg:order-1">
            <div className="text-accent-purple text-h3 font-bold">01</div>
            <h3 className="text-h2 font-bold text-text-primary">
              Salary encrypted before it leaves your browser
            </h3>
            <p className="text-body text-text-secondary">
              Employers enter salary information which is immediately encrypted
              using fhEVM. Only encrypted values ever touch the blockchain.
            </p>
          </div>
          <Card className="bg-bg-tertiary order-1 lg:order-2">
            <div className="font-mono text-body-sm text-text-primary space-y-2">
              <p className="text-accent-green">(// Plaintext)</p>
              <p>salary = 8500</p>
              <p className="mt-4 text-accent-green">(// After encryption)</p>
              <p>encSalary = encrypt(8500)</p>
              <p className="text-text-tertiary">(// Only this is stored on-chain)</p>
            </div>
          </Card>
        </div>

        {/* Step 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-accent-purple text-h3 font-bold">02</div>
            <h3 className="text-h2 font-bold text-text-primary">
              Arithmetic on encrypted numbers
            </h3>
            <p className="text-body text-text-secondary">
              Smart contracts perform operations directly on encrypted values.
              Results stay encrypted. No decryption needed.
            </p>
          </div>
          <Card className="bg-bg-tertiary">
            <div className="font-mono text-body-sm text-text-primary space-y-2">
              <p className="text-accent-green">(// Add on encrypted values)</p>
              <p>result = add(encSalary, encBonus)</p>
              <p className="mt-4 text-accent-green">(// Still encrypted)</p>
              <p>storeOnChain(result)</p>
            </div>
          </Card>
        </div>

        {/* Step 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 order-2 lg:order-1">
            <div className="text-accent-purple text-h3 font-bold">03</div>
            <h3 className="text-h2 font-bold text-text-primary">
              Only you can see your number
            </h3>
            <p className="text-body text-text-secondary">
              Employees decrypt their own salaries locally. Access control lists
              determine who can view what. Full privacy by design.
            </p>
          </div>
          <Card className="bg-bg-tertiary order-1 lg:order-2">
            <div className="space-y-3">
              <table className="w-full text-body-sm font-mono">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left text-text-secondary pb-2">Actor</th>
                    <th className="text-center text-text-secondary pb-2">View</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-light">
                    <td className="py-2 text-text-primary">Employer</td>
                    <td className="text-center text-accent-green">✓</td>
                  </tr>
                  <tr className="border-b border-border-light">
                    <td className="py-2 text-text-primary">Employee</td>
                    <td className="text-center text-accent-green">✓ Own</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-text-primary">Public</td>
                    <td className="text-center text-text-tertiary">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
