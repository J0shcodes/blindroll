import React from 'react'
import { cn } from '@/lib/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', className, showText = false }: LogoProps) {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-h3' },
    md: { icon: 'w-8 h-8', text: 'text-h2' },
    lg: { icon: 'w-10 h-10', text: 'text-h1' },
  }

  const { icon, text } = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Closed eye with lock icon */}
      <div className={cn('relative', icon)}>
        {/* Eye outline */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-accent-purple"
        >
          {/* Closed eye */}
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
          <line x1="3.5" y1="9" x2="20.5" y2="15" strokeWidth="3" />
        </svg>
        {/* Lock icon overlay */}
        <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3 h-3 text-accent-purple bg-bg-primary rounded-sm p-0.5"
          >
            <path d="M8 1a3 3 0 0 0-3 3v4H3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-2V4a3 3 0 0 0-3-3z" />
          </svg>
        </div>
      </div>

      {showText && (
        <span className={cn('font-bold text-text-primary', text)}>Blindroll</span>
      )}
    </div>
  )
}