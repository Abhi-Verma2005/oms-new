'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export const AdminCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800/60 text-card-foreground shadow-sm backdrop-blur-sm',
        className
      )}
      {...props}
    />
  )
)
AdminCard.displayName = 'AdminCard'

export const AdminCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6 border-b border-black/5 dark:border-white/10', className)} {...props} />
  )
)
AdminCardHeader.displayName = 'AdminCardHeader'

export const AdminCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
AdminCardTitle.displayName = 'AdminCardTitle'

export const AdminCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
AdminCardDescription.displayName = 'AdminCardDescription'

export const AdminCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
)
AdminCardContent.displayName = 'AdminCardContent'


