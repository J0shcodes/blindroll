'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'
import { Button } from './Button'
import { Menu, X } from 'lucide-react'
// import { cn } from '@/lib/cn'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: 'Docs', href: 'https://github.com/J0shcodes/blindroll/blob/main/README.md' },
    { label: 'About', href: '#about' },
    { label: 'GitHub', href: 'https://github.com/J0shcodes/blindroll' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xs border-b border-border-light/0 hover:border-border-light transition-colors">
      <div className="container-safe w-full">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" showText />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-body text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link href="/connect">
              <Button variant="primary" size="sm">
                Launch
              </Button>
            </Link>
            
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-bg-secondary rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-bg-secondary border-t border-border-light py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-4 py-2 text-body text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="px-4 pt-4 border-t border-border-light">
              <Link href="/connect">
                <Button variant="primary" fullWidth size="sm">Launch</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
