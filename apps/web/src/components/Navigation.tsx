'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { User, Settings, Sparkles, LogOut, ChevronDown, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface ProfileDropdownProps {
  user: any
  hasPermission: (permission: string) => boolean
  hasRole: (role: string | string[]) => boolean
  onLogout: () => void
}

function ProfileDropdown({ user, hasPermission, hasRole, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  const handleLogoutClick = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full hover:bg-accent transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">{user.username}</div>
          {user.role && user.role !== 'builder' && (
            <div className="text-xs text-muted-foreground capitalize">
              {user.role.replace(/_/g, ' ')}
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2 z-[9999]">
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-border">
            <div className="font-medium">{user.username}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            {user.role && (
              <div className="mt-1">
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded capitalize">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </button>

            {hasPermission('use_ai_agents') && (
              <button
                onClick={() => handleNavigation('/ai-config')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Agents
              </button>
            )}

            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              disabled={!mounted}
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 disabled:opacity-50"
            >
              {!mounted ? (
                <>
                  <Moon className="h-4 w-4" />
                  Theme
                </>
              ) : resolvedTheme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              )}
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border pt-1">
            <button
              onClick={handleLogoutClick}
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent text-red-600 dark:text-red-400 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const navigation = [
  { name: 'Blocks', href: '/blocks', roles: ['*'] },
  { name: 'Paths', href: '/paths', roles: ['*'] },
  { name: 'Create with AI', href: '/create', roles: ['builder', 'trusted_builder', 'moderator', 'admin'], permission: 'use_ai_agents' },
  { name: 'AI Jobs', href: '/ai-jobs', roles: ['builder', 'trusted_builder', 'moderator', 'admin'], permission: 'use_ai_agents' },
  { name: 'Search', href: '/search', roles: ['*'] },
  { name: 'Developers', href: '/developers', roles: ['*'] },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, hasRole, hasPermission, logout } = useAuth()

  // Avoid hydration mismatch by only filtering navigation after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const canSeeNavItem = (item: any) => {
    if (item.roles.includes('*')) return true
    if (!isAuthenticated) return false
    const hasRequiredRole = item.roles.some((role: string) => hasRole(role))
    // If item has a permission requirement, check it
    if (item.permission && !hasPermission(item.permission)) return false
    return hasRequiredRole
  }

  // Show all navigation items on server/initial render to avoid hydration mismatch
  const visibleNavItems = mounted ? navigation.filter(canSeeNavItem) : navigation

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
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
              {visibleNavItems.map((item) => (
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
            {/* Auth Status - Profile Dropdown or Sign In */}
            {isAuthenticated && user ? (
              <ProfileDropdown 
                user={user} 
                hasPermission={hasPermission}
                hasRole={hasRole}
                onLogout={handleLogout}
              />
            ) : (
              <Link
                href="/auth/signin"
                className="hidden md:block text-sm px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
              >
                Sign In
              </Link>
            )}

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
              {visibleNavItems.map((item) => (
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
