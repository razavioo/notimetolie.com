'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface NavigationState {
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  breadcrumbs: BreadcrumbItem[]
  activeSection: string | null
}

interface BreadcrumbItem {
  label: string
  href: string
  icon?: any
}

interface NavigationContextType extends NavigationState {
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  setActiveSection: (section: string | null) => void
  closeAll: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>({
    isMobileMenuOpen: false,
    isSearchOpen: false,
    breadcrumbs: [],
    activeSection: null,
  })

  const setMobileMenuOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isMobileMenuOpen: open }))
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setState(prev => ({ ...prev, isMobileMenuOpen: !prev.isMobileMenuOpen }))
  }, [])

  const setSearchOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isSearchOpen: open }))
  }, [])

  const toggleSearch = useCallback(() => {
    setState(prev => ({ ...prev, isSearchOpen: !prev.isSearchOpen }))
  }, [])

  const setBreadcrumbs = useCallback((breadcrumbs: BreadcrumbItem[]) => {
    setState(prev => ({ ...prev, breadcrumbs }))
  }, [])

  const setActiveSection = useCallback((section: string | null) => {
    setState(prev => ({ ...prev, activeSection: section }))
  }, [])

  const closeAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMobileMenuOpen: false,
      isSearchOpen: false,
    }))
  }, [])

  const value: NavigationContextType = {
    ...state,
    setMobileMenuOpen,
    toggleMobileMenu,
    setSearchOpen,
    toggleSearch,
    setBreadcrumbs,
    setActiveSection,
    closeAll,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Hook for managing page breadcrumbs
export function useBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useNavigation()
  
  useState(() => {
    setBreadcrumbs(breadcrumbs)
  })
}