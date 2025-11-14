'use client'

export function NavigationSkeleton() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 relative z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Skeleton */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
              <div className="w-40 h-6 rounded bg-muted animate-pulse" />
            </div>

            {/* Desktop Navigation Skeleton */}
            <div className="hidden md:flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-3 py-2">
                  <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Right side skeleton */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div>
                <div className="w-20 h-4 rounded bg-muted animate-pulse mb-1" />
                <div className="w-16 h-3 rounded bg-muted animate-pulse" />
              </div>
              <div className="w-4 h-4 rounded bg-muted animate-pulse" />
            </div>

            {/* Mobile menu button skeleton */}
            <div className="md:hidden p-2">
              <div className="w-6 h-6 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export function BreadcrumbsSkeleton() {
  return (
    <div className="flex items-center space-x-2 py-3">
      <div className="w-12 h-4 rounded bg-muted animate-pulse" />
      <div className="w-4 h-4 rounded bg-muted animate-pulse" />
      <div className="w-20 h-4 rounded bg-muted animate-pulse" />
      <div className="w-4 h-4 rounded bg-muted animate-pulse" />
      <div className="w-24 h-4 rounded bg-muted animate-pulse" />
    </div>
  )
}

export function ProfileDropdownSkeleton() {
  return (
    <div className="absolute right-0 mt-2 w-64 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-xl py-2 z-[9999]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="w-32 h-4 rounded bg-muted animate-pulse mb-2" />
        <div className="w-48 h-3 rounded bg-muted animate-pulse mb-2" />
        <div className="w-20 h-5 rounded-full bg-muted animate-pulse" />
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-muted animate-pulse" />
            <div className="w-24 h-4 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="border-t border-border pt-1">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-muted animate-pulse" />
          <div className="w-20 h-4 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Loading indicator for navigation actions
export function NavigationLoadingIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-background z-[200]">
      <div className="h-full bg-primary animate-pulse" style={{
        animation: 'navigation-loading 1s ease-in-out infinite',
      }}>
        <style jsx>{`
          @keyframes navigation-loading {
            0% {
              width: 0%;
              margin-left: 0;
            }
            50% {
              width: 100%;
              margin-left: 0;
            }
            100% {
              width: 0%;
              margin-left: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

// Shimmer effect component
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

// Skeleton wrapper with shimmer effect
export function SkeletonBox({ 
  className = '', 
  width, 
  height 
}: { 
  className?: string
  width?: string | number
  height?: string | number 
}) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div 
      className={`relative bg-muted rounded overflow-hidden ${className}`}
      style={style}
    >
      <Shimmer />
    </div>
  )
}