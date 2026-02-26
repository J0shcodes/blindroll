import React from 'react'
import { cn } from '@/lib/cn'
import type { ButtonProps } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  className,
  fullWidth = false,
  ...props
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-body-sm',
    md: 'px-6 py-3 text-body',
    lg: 'px-8 py-4 text-body font-semibold',
  }

  const variantClasses = {
    primary:
      'bg-accent-purple text-white hover:bg-accent-purple/90 active:bg-accent-purple/80',
    secondary:
      'bg-transparent border border-border-medium text-text-primary hover:bg-bg-secondary active:bg-bg-tertiary',
    tertiary: 'bg-transparent text-accent-purple hover:bg-bg-secondary active:bg-bg-tertiary',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200',
        'focus:outline-none focus-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
