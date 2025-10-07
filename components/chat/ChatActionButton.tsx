"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export type ChatActionButtonVariant = 'primary' | 'secondary' | 'tertiary'

interface ChatActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon?: React.ReactNode
  variant?: ChatActionButtonVariant
  loading?: boolean
}

export function ChatActionButton({
  label,
  icon,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: ChatActionButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-[6px] transition-all duration-150 ease-out whitespace-nowrap'
  const size = 'px-3 py-1.5 text-[13px] font-medium'
  const styles =
    variant === 'primary'
      ? 'bg-violet-600/90 text-white hover:bg-violet-700'
      : variant === 'secondary'
        ? 'bg-transparent text-white/90 border border-white/10 hover:bg-white/5'
        : 'bg-transparent text-white/60 hover:text-white/80'

  return (
    <button
      disabled={disabled || loading}
      className={cn(base, size, styles, disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer', className)}
      {...props}
    >
      {loading && (
        <span className="inline-flex h-3 w-3 items-center justify-center">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </span>
      )}
      {!loading && icon ? <span className="inline-flex items-center justify-center h-4 w-4">{icon}</span> : null}
      <span>{label}</span>
    </button>
  )
}

export default ChatActionButton


