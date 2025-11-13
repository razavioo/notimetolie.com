'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { name: 'Home', href: '/', roles: ['*'] },
  { name: 'Blocks', href: '/blocks', roles: ['*'] },
  { name: 'Paths', href: '/paths', roles: ['*'] },
  { name: 'Search', href: '/search', roles: ['*'] },
  { name: 'API', href: '/docs', roles: ['*'] },
  { name: 'MCP', href: '/mcp', roles: ['*'] },
  { name: 'Moderation', href: '/moderation', roles: ['moderator', 'admin'] },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, hasRole, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const canSeeNavItem = (item: typeof navigation[0]) => {
    if (item.roles.includes('*')) return true
    if (!isAuthenticated) return false
    return item.roles.some(role => hasRole(role))
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                No Time To Lie
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {navigation.filter(canSeeNavItem).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-200 hover:text-primary ${
                    pathname === item.href
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auth Status */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/profile"
                  className="text-sm text-foreground hover:text-primary font-medium flex items-center gap-1"
                >
                  <span>{user.username}</span>
                  {user.role && user.role !== 'builder' && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 border border-border rounded hover:bg-accent transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="hidden md:block text-sm px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
              >
                Sign In
              </Link>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.filter(canSeeNavItem).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth */}
              {isAuthenticated && user ? (
                <div className="px-3 py-2 border-t space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-gray-100"
                  >
                    {user.username}
                    {user.role && user.role !== 'builder' && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}

              {/* Mobile Theme Toggle */}
              <div className="px-3 py-2 border-t">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
