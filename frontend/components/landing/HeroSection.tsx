'use client'

import Link from 'next/link'
import { Button } from '@/components/Button'
import { EncryptionVisualizer } from '../EncryptionVisualizer'

export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center py-12 md:py-20">
      <div className="container-safe w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6 md:space-y-8 animate-fade-in">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-border-light bg-bg-secondary/50 text-xs md:text-body-sm">
              <span className="text-accent-purple">✓</span>
              <span className="text-text-secondary">
                End-to-end encrypted payroll
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-display font-bold text-text-primary leading-tight mb-3 md:mb-4">
                Encrypted Salary Management
              </h1>
              <p className="text-lg md:text-h3 text-text-secondary font-normal">
                Only authorized parties can see encrypted salary data. Employees
                stay private. Smart contracts stay secret.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link href="/connect">
                <Button variant="primary" size="lg" className="min-w-fit">
                  Get Started
                </Button>
              </Link>
              <a href="https://github.com/J0shcodes/blindroll" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg" className="min-w-fit">
                  View Docs
                </Button>
              </a>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 pt-6 md:pt-8 border-t border-border-light">
              <div>
                <p className="text-sm md:text-body font-semibold text-text-primary">
                  Open Source
                </p>
                <p className="text-xs md:text-body-sm text-text-secondary">
                  Fully transparent
                </p>
              </div>
              <div>
                <p className="text-sm md:text-body font-semibold text-text-primary">
                  Testnet Ready
                </p>
                <p className="text-xs md:text-body-sm text-text-secondary">
                  Deploy today
                </p>
              </div>
              <div>
                <p className="text-sm md:text-body font-semibold text-text-primary">
                  No Signup
                </p>
                <p className="text-xs md:text-body-sm text-text-secondary">
                  Self-custodial
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Encryption Visualizer */}
          <div className="animate-slide-up mt-8 lg:mt-0">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-4 md:p-6 lg:p-8">
              <EncryptionVisualizer />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
