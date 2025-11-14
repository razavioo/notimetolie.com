'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'
import { getBreadcrumbs, type NavigationItem } from '@/config/navigation.config'

interface BreadcrumbsProps {
  items?: NavigationItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Use provided items or generate from pathname using navigation config
  const breadcrumbItems = items || getBreadcrumbs(pathname)

  // Don't show breadcrumbs on home page
  if (breadcrumbItems.length <= 1 || pathname === '/') {
    return null
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const Icon = item.icon

          return (
            <Fragment key={item.id || item.href}>
              <li className="flex items-center">
                {isLast ? (
                  <span 
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-foreground font-medium"
                    aria-current="page"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="max-w-[200px] truncate">{item.label}</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    title={item.description}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="max-w-[200px] truncate">{item.label}</span>
                  </Link>
                )}
              </li>
              
              {!isLast && (
                <li>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

// Compact version for mobile
export function BreadcrumbsCompact({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbItems = items || getBreadcrumbs(pathname)

  if (breadcrumbItems.length <= 1 || pathname === '/') {
    return null
  }

  // Show only last item on mobile
  const lastItem = breadcrumbItems[breadcrumbItems.length - 1]
  const Icon = lastItem.icon

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center text-sm ${className}`}
    >
      <span 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-foreground font-medium"
        aria-current="page"
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className="truncate">{lastItem.label}</span>
      </span>
    </nav>
  )
}

// Structured data for SEO
export function BreadcrumbsStructuredData({ items }: { items?: NavigationItem[] }) {
  const pathname = usePathname()
  const breadcrumbItems = items || getBreadcrumbs(pathname)

  if (breadcrumbItems.length <= 1) {
    return null
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://notimetolie.com'}${item.href}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}