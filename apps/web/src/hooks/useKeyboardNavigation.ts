'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  enabled?: boolean
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onSpace?: () => void
  onTab?: (event: KeyboardEvent) => void
}

export function useKeyboardNavigation({
  enabled = true,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onEnter,
  onSpace,
  onTab,
}: UseKeyboardNavigationOptions = {}) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault()
          onEscape()
        }
        break
      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault()
          onArrowUp()
        }
        break
      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault()
          onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault()
          onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault()
          onArrowRight()
        }
        break
      case 'Enter':
        if (onEnter) {
          event.preventDefault()
          onEnter()
        }
        break
      case ' ':
        if (onSpace) {
          event.preventDefault()
          onSpace()
        }
        break
      case 'Tab':
        if (onTab) {
          onTab(event)
        }
        break
    }
  }, [enabled, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onSpace, onTab])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

// Hook for focus trap within a container
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element when trap is enabled
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled])

  return containerRef
}

// Hook for roving tabindex (for menus and lists)
export function useRovingTabIndex<T extends HTMLElement>() {
  const itemsRef = useRef<T[]>([])
  const currentIndexRef = useRef(0)

  const registerItem = useCallback((item: T | null) => {
    if (item && !itemsRef.current.includes(item)) {
      itemsRef.current.push(item)
    }
  }, [])

  const focusNext = useCallback(() => {
    const items = itemsRef.current
    if (items.length === 0) return

    currentIndexRef.current = (currentIndexRef.current + 1) % items.length
    items[currentIndexRef.current]?.focus()
  }, [])

  const focusPrevious = useCallback(() => {
    const items = itemsRef.current
    if (items.length === 0) return

    currentIndexRef.current = currentIndexRef.current === 0 
      ? items.length - 1 
      : currentIndexRef.current - 1
    items[currentIndexRef.current]?.focus()
  }, [])

  const focusFirst = useCallback(() => {
    const items = itemsRef.current
    if (items.length === 0) return

    currentIndexRef.current = 0
    items[0]?.focus()
  }, [])

  const focusLast = useCallback(() => {
    const items = itemsRef.current
    if (items.length === 0) return

    currentIndexRef.current = items.length - 1
    items[currentIndexRef.current]?.focus()
  }, [])

  return {
    registerItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  }
}