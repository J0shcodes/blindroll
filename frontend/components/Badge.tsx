import React from 'react'
import { cn } from '@/lib/cn'
import type { BadgeProps } from '@/lib/types'

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variantClasses = {
    success: 'bg-accent-green/10 text-accent-green',
    warning: 'bg-accent-amber/10 text-accent-amber',
    error: 'bg-accent-red/10 text-accent-red',
    default: 'bg-border-light text-text-secondary',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-caption font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}