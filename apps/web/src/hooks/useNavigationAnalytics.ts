'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavigationEvent {
  type: 'navigation' | 'click' | 'search' | 'menu_open' | 'menu_close'
  path?: string
  from?: string
  to?: string
  target?: string
  timestamp: number
  metadata?: Record<string, any>
}

interface AnalyticsConfig {
  enabled?: boolean
  debug?: boolean
  trackClicks?: boolean
  trackNavigation?: boolean
  trackSearch?: boolean
  customHandler?: (event: NavigationEvent) => void
}

// Global analytics queue
const analyticsQueue: NavigationEvent[] = []
let isProcessing = false

// Process analytics events
async function processAnalyticsQueue() {
  if (isProcessing || analyticsQueue.length === 0) return
  
  isProcessing = true
  
  while (analyticsQueue.length > 0) {
    const event = analyticsQueue.shift()
    if (event) {
      // Send to analytics service (e.g., Google Analytics, Plausible, custom API)
      try {
        // Example: Send to custom API
        // await fetch('/api/analytics', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(event),
        // })
        
        // For now, just log in debug mode
        if (typeof window !== 'undefined' && (window as any).__ANALYTICS_DEBUG__) {
          console.log('[Analytics]', event)
        }
      } catch (error) {
        console.error('[Analytics] Error processing event:', error)
      }
    }
  }
  
  isProcessing = false
}

// Add event to queue
function trackEvent(event: NavigationEvent) {
  analyticsQueue.push(event)
  processAnalyticsQueue()
}

export function useNavigationAnalytics(config: AnalyticsConfig = {}) {
  const {
    enabled = true,
    debug = false,
    trackClicks = true,
    trackNavigation = true,
    trackSearch = true,
    customHandler,
  } = config

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousPathRef = useRef<string>('')

  // Enable debug mode
  useEffect(() => {
    if (debug && typeof window !== 'undefined') {
      (window as any).__ANALYTICS_DEBUG__ = true
    }
  }, [debug])

  // Track page navigation
  useEffect(() => {
    if (!enabled || !trackNavigation) return

    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    if (previousPathRef.current && previousPathRef.current !== currentPath) {
      const event: NavigationEvent = {
        type: 'navigation',
        from: previousPathRef.current,
        to: currentPath,
        timestamp: Date.now(),
      }

      if (customHandler) {
        customHandler(event)
      } else {
        trackEvent(event)
      }
    }

    previousPathRef.current = currentPath
  }, [pathname, searchParams, enabled, trackNavigation, customHandler])

  // Track click events
  const trackClick = useCallback((target: string, metadata?: Record<string, any>) => {
    if (!enabled || !trackClicks) return

    const event: NavigationEvent = {
      type: 'click',
      target,
      path: pathname,
      timestamp: Date.now(),
      metadata,
    }

    if (customHandler) {
      customHandler(event)
    } else {
      trackEvent(event)
    }
  }, [enabled, trackClicks, pathname, customHandler])

  // Track search events
  const trackSearchQuery = useCallback((query: string, results?: number) => {
    if (!enabled || !trackSearch) return

    const event: NavigationEvent = {
      type: 'search',
      path: pathname,
      timestamp: Date.now(),
      metadata: { query, results },
    }

    if (customHandler) {
      customHandler(event)
    } else {
      trackEvent(event)
    }
  }, [enabled, trackSearch, pathname, customHandler])

  // Track menu interactions
  const trackMenuOpen = useCallback((menuType: string) => {
    if (!enabled) return

    const event: NavigationEvent = {
      type: 'menu_open',
      target: menuType,
      path: pathname,
      timestamp: Date.now(),
    }

    if (customHandler) {
      customHandler(event)
    } else {
      trackEvent(event)
    }
  }, [enabled, pathname, customHandler])

  const trackMenuClose = useCallback((menuType: string) => {
    if (!enabled) return

    const event: NavigationEvent = {
      type: 'menu_close',
      target: menuType,
      path: pathname,
      timestamp: Date.now(),
    }

    if (customHandler) {
      customHandler(event)
    } else {
      trackEvent(event)
    }
  }, [enabled, pathname, customHandler])

  return {
    trackClick,
    trackSearchQuery,
    trackMenuOpen,
    trackMenuClose,
  }
}

// Hook for tracking time on page
export function usePageViewDuration() {
  const pathname = usePathname()
  const startTimeRef = useRef<number>(Date.now())
  const durationRef = useRef<number>(0)

  useEffect(() => {
    startTimeRef.current = Date.now()

    return () => {
      durationRef.current = Date.now() - startTimeRef.current
      
      // Track duration on unmount
      trackEvent({
        type: 'navigation',
        path: pathname,
        timestamp: Date.now(),
        metadata: {
          duration: durationRef.current,
          durationSeconds: Math.round(durationRef.current / 1000),
        },
      })
    }
  }, [pathname])

  return durationRef.current
}

// Hook for tracking scroll depth
export function useScrollDepth() {
  const pathname = usePathname()
  const maxScrollRef = useRef<number>(0)

  useEffect(() => {
    maxScrollRef.current = 0

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercentage)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      
      // Track max scroll depth on unmount
      if (maxScrollRef.current > 0) {
        trackEvent({
          type: 'navigation',
          path: pathname,
          timestamp: Date.now(),
          metadata: {
            scrollDepth: Math.round(maxScrollRef.current),
          },
        })
      }
    }
  }, [pathname])

  return maxScrollRef.current
}

// Hook for tracking user engagement
export function useEngagementTracking() {
  const pathname = usePathname()
  const engagementRef = useRef({
    clicks: 0,
    keystrokes: 0,
    startTime: Date.now(),
  })

  useEffect(() => {
    engagementRef.current = {
      clicks: 0,
      keystrokes: 0,
      startTime: Date.now(),
    }

    const handleClick = () => {
      engagementRef.current.clicks++
    }

    const handleKeyDown = () => {
      engagementRef.current.keystrokes++
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      
      const duration = Date.now() - engagementRef.current.startTime
      
      // Track engagement on unmount
      trackEvent({
        type: 'navigation',
        path: pathname,
        timestamp: Date.now(),
        metadata: {
          engagement: {
            clicks: engagementRef.current.clicks,
            keystrokes: engagementRef.current.keystrokes,
            durationMs: duration,
            engagementScore: (engagementRef.current.clicks + engagementRef.current.keystrokes) / (duration / 1000),
          },
        },
      })
    }
  }, [pathname])

  return engagementRef.current
}