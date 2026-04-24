import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

const variants = {
  primary:   'bg-gradient-to-r from-green to-cyan text-bg font-bold border-0 shadow-[0_0_30px_oklch(74%_0.22_142_/_0.35)] hover:opacity-90',
  secondary: 'bg-surface2 border border-border text-ph-text hover:border-border2 hover:bg-surface3',
  ghost:     'bg-transparent border border-border text-muted hover:border-cyan hover:text-cyan',
}

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
