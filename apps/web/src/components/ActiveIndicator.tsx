'use client'

import { useEffect, useState } from 'react'

interface ActiveIndicatorProps {
  isActive: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function ActiveIndicator({ 
  isActive, 
  position = 'bottom',
  className = '' 
}: ActiveIndicatorProps) {
  const [shouldRender, setShouldRender] = useState(isActive)

  useEffect(() => {
    if (isActive) {
      setShouldRender(true)
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isActive])

  if (!shouldRender) return null

  const positionClasses = {
    top: 'top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5',
    left: 'left-0 top-1/2 -translate-y-1/2 h-1/2 w-0.5',
    right: 'right-0 top-1/2 -translate-y-1/2 h-1/2 w-0.5',
  }

  return (
    <div
      className={`
        absolute bg-primary rounded-full
        ${positionClasses[position]}
        ${isActive ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : 'animate-out fade-out slide-out-to-bottom-2 duration-300'}
        ${className}
      `}
    />
  )
}

// Pulse indicator for notifications
export function PulseIndicator({ 
  show = true,
  size = 'sm',
  className = '' 
}: { 
  show?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string 
}) {
  if (!show) return null

  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  }

  return (
    <span className="relative inline-flex">
      <span
        className={`
          absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping
          ${className}
        `}
      />
      <span
        className={`
          relative inline-flex rounded-full bg-primary
          ${sizeClasses[size]}
          ${className}
        `}
      />
    </span>
  )
}

// Badge with count
export function NotificationBadge({ 
  count, 
  max = 99,
  className = '' 
}: { 
  count: number
  max?: number
  className?: string 
}) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <span
      className={`
        absolute -top-1 -right-1 flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-[10px] font-bold text-white bg-red-500 rounded-full
        ring-2 ring-background
        animate-in zoom-in-50 duration-200
        ${className}
      `}
    >
      {displayCount}
    </span>
  )
}

// Focus ring component
export function FocusRing({ 
  visible = true,
  variant = 'primary',
  className = '' 
}: { 
  visible?: boolean
  variant?: 'primary' | 'danger' | 'success'
  className?: string 
}) {
  if (!visible) return null

  const variantClasses = {
    primary: 'ring-primary',
    danger: 'ring-red-500',
    success: 'ring-green-500',
  }

  return (
    <div
      className={`
        absolute inset-0 rounded-lg pointer-events-none
        ring-2 ${variantClasses[variant]} ring-offset-2 ring-offset-background
        animate-in fade-in duration-150
        ${className}
      `}
    />
  )
}

// Progress bar for navigation loading
export function NavigationProgress({ 
  progress = 0,
  className = '' 
}: { 
  progress: number
  className?: string 
}) {
  if (progress <= 0) return null

  return (
    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  )
}

// Hover highlight effect
export function HoverHighlight({ 
  children,
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`group relative ${className}`}>
      <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors duration-200" />
      {children}
    </div>
  )
}

// Animated underline
export function AnimatedUnderline({ 
  isActive = false,
  className = '' 
}: { 
  isActive?: boolean
  className?: string 
}) {
  return (
    <span
      className={`
        absolute bottom-0 left-0 right-0 h-0.5 bg-primary
        origin-left transition-transform duration-300 ease-out
        ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}
        ${className}
      `}
    />
  )
}

// Skeleton pulse for loading states
export function SkeletonPulse({ 
  className = '',
  rounded = 'md'
}: { 
  className?: string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  return (
    <div
      className={`
        bg-muted animate-pulse
        ${roundedClasses[rounded]}
        ${className}
      `}
    />
  )
}