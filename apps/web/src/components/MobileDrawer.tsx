'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useKeyboardNavigation'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  position?: 'left' | 'right' | 'bottom'
  className?: string
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'left',
  className = '',
}: MobileDrawerProps) {
  const containerRef = useFocusTrap(isOpen) as React.RefObject<HTMLDivElement>
  const drawerRef = useRef<HTMLDivElement>(null)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Set initial focus
      const focusableElement = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusableElement?.focus()
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const positionClasses = {
    left: 'left-0 top-0 h-full w-80 max-w-[85vw] translate-x-0',
    right: 'right-0 top-0 h-full w-80 max-w-[85vw] translate-x-0',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh] translate-y-0 rounded-t-2xl',
  }

  const animationClasses = {
    left: 'animate-in slide-in-from-left duration-300',
    right: 'animate-in slide-in-from-right duration-300',
    bottom: 'animate-in slide-in-from-bottom duration-300',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Navigation drawer'}
        className={`
          fixed bg-background border-border z-[101]
          ${positionClasses[position]}
          ${animationClasses[position]}
          ${position !== 'bottom' ? 'border-r' : 'border-t'}
          ${className}
        `}
      >
        <div ref={drawerRef} className="flex flex-col h-full">
          {/* Header */}
          {(title || true) && (
            <div className="flex items-center justify-between p-4 border-b border-border">
              {title && (
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// Bottom sheet variant for mobile
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  className = '',
}: Omit<MobileDrawerProps, 'position'>) {
  return (
    <MobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      title={title}
      className={className}
    >
      {children}
    </MobileDrawer>
  )
}

// Swipeable drawer with gesture support
export function SwipeableDrawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'bottom',
  className = '',
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY
    const diff = currentYRef.current - startYRef.current

    if (position === 'bottom' && diff > 0) {
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${diff}px)`
      }
    }
  }

  const handleTouchEnd = () => {
    const diff = currentYRef.current - startYRef.current
    
    if (drawerRef.current) {
      drawerRef.current.style.transform = ''
    }

    // Close if swiped down more than 100px
    if (position === 'bottom' && diff > 100) {
      onClose()
    }
  }

  return (
    <MobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      title={title}
      className={className}
    >
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="transition-transform"
      >
        {position === 'bottom' && (
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
        )}
        {children}
      </div>
    </MobileDrawer>
  )
}