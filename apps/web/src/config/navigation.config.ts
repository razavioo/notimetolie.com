/**
 * Navigation Configuration
 * 
 * This file defines the complete navigation hierarchy and structure
 * for the application. It serves as the single source of truth for
 * all navigation-related information.
 * 
 * Architecture Principles:
 * 1. Clear hierarchy - Parent/child relationships
 * 2. Extensible - Easy to add new routes
 * 3. Type-safe - Full TypeScript support
 * 4. Permission-based - Role and permission checks
 * 5. Metadata-rich - SEO, analytics, breadcrumbs
 */

import { LucideIcon } from 'lucide-react'
import {
  Home,
  Blocks,
  Map,
  Search,
  Code,
  Sparkles,
  User,
  Settings,
  Shield,
  Bell,
  FileText,
  Folder,
  Database,
} from 'lucide-react'

/**
 * Navigation Item Type
 */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  description?: string
  
  // Hierarchy
  parent?: string
  children?: NavigationItem[]
  
  // Access Control
  roles?: string[] // ['*'] means public
  permissions?: string[]
  requiresAuth?: boolean
  
  // Behavior
  showInNav?: boolean // Show in main navigation
  showInSidebar?: boolean // Show in sidebar
  showInFooter?: boolean // Show in footer
  isExternal?: boolean // External link
  
  // Metadata
  category?: string
  tags?: string[]
  order?: number // Display order within category
  
  // SEO & Analytics
  meta?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  analytics?: {
    category?: string
    action?: string
  }
}

/**
 * Navigation Categories
 * Logical grouping of routes
 */
export enum NavigationCategory {
  MAIN = 'main',
  CONTENT = 'content',
  AI = 'ai',
  USER = 'user',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  AUTH = 'auth',
}

/**
 * Complete Navigation Structure
 * Organized hierarchically with clear parent-child relationships
 */
export const navigationStructure: NavigationItem[] = [
  // ==================== PUBLIC ROUTES ====================
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    description: 'Homepage and overview',
    roles: ['*'],
    showInNav: false, // Logo serves as home link
    showInFooter: true,
    category: NavigationCategory.MAIN,
    order: 0,
    meta: {
      title: 'Home - No Time To Lie',
      description: 'Living Knowledge Infrastructure',
    },
  },

  // ==================== CONTENT MANAGEMENT ====================
  {
    id: 'content',
    label: 'Content',
    href: '#', // Not a real route, just category
    icon: Folder,
    category: NavigationCategory.CONTENT,
    showInNav: false,
    children: [
      {
        id: 'blocks',
        label: 'Blocks',
        href: '/blocks',
        icon: Blocks,
        description: 'Browse and manage knowledge blocks',
        roles: ['*'],
        showInNav: true,
        showInSidebar: true,
        category: NavigationCategory.CONTENT,
        order: 1,
        children: [
          {
            id: 'blocks-view',
            label: 'View Block',
            href: '/blocks/[slug]',
            parent: 'blocks',
            showInNav: false,
            roles: ['*'],
          },
          {
            id: 'blocks-create',
            label: 'Create Block',
            href: '/create',
            parent: 'blocks',
            showInNav: false,
            roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
            requiresAuth: true,
          },
          {
            id: 'blocks-create-ai',
            label: 'Create with AI',
            href: '/blocks/create-with-ai',
            parent: 'blocks',
            showInNav: false,
            roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
            permissions: ['use_ai_agents'],
            requiresAuth: true,
          },
        ],
      },
      {
        id: 'paths',
        label: 'Paths',
        href: '/paths',
        icon: Map,
        description: 'Browse and manage learning paths',
        roles: ['*'],
        showInNav: true,
        showInSidebar: true,
        category: NavigationCategory.CONTENT,
        order: 2,
        children: [
          {
            id: 'paths-view',
            label: 'View Path',
            href: '/paths/[slug]',
            parent: 'paths',
            showInNav: false,
            roles: ['*'],
          },
          {
            id: 'paths-create',
            label: 'Create Path',
            href: '/paths/create',
            parent: 'paths',
            showInNav: false,
            roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
            requiresAuth: true,
          },
          {
            id: 'paths-create-ai',
            label: 'Create with AI',
            href: '/paths/create-with-ai',
            parent: 'paths',
            showInNav: false,
            roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
            permissions: ['use_ai_agents'],
            requiresAuth: true,
          },
        ],
      },
    ],
  },

  // ==================== AI FEATURES ====================
  {
    id: 'ai',
    label: 'AI',
    href: '#',
    icon: Sparkles,
    category: NavigationCategory.AI,
    showInNav: false,
    children: [
      {
        id: 'ai-create',
        label: 'AI Create',
        href: '/ai-create',
        icon: Sparkles,
        description: 'Create content with AI assistance',
        roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
        permissions: ['use_ai_agents'],
        requiresAuth: true,
        showInNav: true,
        category: NavigationCategory.AI,
        order: 3,
      },
      {
        id: 'ai-config',
        label: 'AI Configuration',
        href: '/ai-config',
        description: 'Manage AI agents and configurations',
        roles: ['trusted_builder', 'moderator', 'admin'],
        permissions: ['use_ai_agents'],
        requiresAuth: true,
        showInNav: false,
        showInSidebar: true,
        category: NavigationCategory.AI,
        children: [
          {
            id: 'ai-config-create',
            label: 'Create Configuration',
            href: '/ai-config/[id]/create',
            parent: 'ai-config',
            showInNav: false,
            roles: ['trusted_builder', 'moderator', 'admin'],
            requiresAuth: true,
          },
        ],
      },
      {
        id: 'ai-jobs',
        label: 'AI Jobs',
        href: '/ai-jobs',
        description: 'View AI job status and history',
        roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
        permissions: ['use_ai_agents'],
        requiresAuth: true,
        showInNav: false,
        showInSidebar: true,
        category: NavigationCategory.AI,
      },
    ],
  },

  // ==================== SEARCH & DISCOVERY ====================
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: Search,
    description: 'Search across all content',
    roles: ['*'],
    showInNav: true,
    category: NavigationCategory.MAIN,
    order: 4,
  },

  // ==================== DEVELOPER RESOURCES ====================
  {
    id: 'developers',
    label: 'Developers',
    href: '/developers',
    icon: Code,
    description: 'API documentation and developer resources',
    roles: ['*'],
    showInNav: true,
    showInFooter: true,
    category: NavigationCategory.DEVELOPER,
    order: 5,
    children: [
      {
        id: 'docs',
        label: 'Documentation',
        href: '/docs',
        icon: FileText,
        parent: 'developers',
        roles: ['*'],
        showInNav: false,
        showInSidebar: true,
      },
      {
        id: 'mcp',
        label: 'MCP',
        href: '/mcp',
        icon: Database,
        description: 'Model Context Protocol',
        parent: 'developers',
        roles: ['developer', 'admin'],
        requiresAuth: true,
        showInNav: false,
        showInSidebar: true,
      },
    ],
  },

  // ==================== USER MANAGEMENT ====================
  {
    id: 'user',
    label: 'User',
    href: '#',
    icon: User,
    category: NavigationCategory.USER,
    showInNav: false,
    children: [
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
        description: 'View and edit your profile',
        roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
        requiresAuth: true,
        showInNav: false,
        showInSidebar: true,
        category: NavigationCategory.USER,
        children: [
          {
            id: 'profile-settings',
            label: 'Settings',
            href: '/profile/settings',
            parent: 'profile',
            roles: ['builder', 'trusted_builder', 'moderator', 'admin'],
            requiresAuth: true,
            showInNav: false,
          },
        ],
      },
    ],
  },

  // ==================== ADMIN & MODERATION ====================
  {
    id: 'admin',
    label: 'Administration',
    href: '#',
    icon: Shield,
    category: NavigationCategory.ADMIN,
    showInNav: false,
    children: [
      {
        id: 'moderation',
        label: 'Moderation',
        href: '/moderation',
        icon: Bell,
        description: 'Review and moderate content',
        roles: ['moderator', 'admin'],
        permissions: ['moderate_content'],
        requiresAuth: true,
        showInNav: false,
        showInSidebar: true,
        category: NavigationCategory.ADMIN,
      },
      {
        id: 'settings',
        label: 'Site Settings',
        href: '/settings',
        icon: Settings,
        description: 'Manage site-wide settings',
        roles: ['admin'],
        requiresAuth: true,
        showInNav: false,
        showInSidebar: true,
        category: NavigationCategory.ADMIN,
      },
    ],
  },

  // ==================== AUTHENTICATION ====================
  {
    id: 'auth',
    label: 'Authentication',
    href: '#',
    category: NavigationCategory.AUTH,
    showInNav: false,
    children: [
      {
        id: 'signin',
        label: 'Sign In',
        href: '/auth/signin',
        description: 'Sign in to your account',
        roles: ['*'],
        showInNav: false,
        category: NavigationCategory.AUTH,
      },
      {
        id: 'signup',
        label: 'Sign Up',
        href: '/auth/signup',
        description: 'Create a new account',
        roles: ['*'],
        showInNav: false,
        category: NavigationCategory.AUTH,
      },
      // Legacy routes (for backward compatibility)
      {
        id: 'login',
        label: 'Login',
        href: '/login',
        roles: ['*'],
        showInNav: false,
        category: NavigationCategory.AUTH,
      },
      {
        id: 'register',
        label: 'Register',
        href: '/register',
        roles: ['*'],
        showInNav: false,
        category: NavigationCategory.AUTH,
      },
    ],
  },
]

/**
 * Helper Functions
 */

// Get all items that should show in main navigation
export function getMainNavItems(): NavigationItem[] {
  return getAllItems().filter(item => item.showInNav === true)
}

// Get all items that should show in sidebar
export function getSidebarItems(): NavigationItem[] {
  return getAllItems().filter(item => item.showInSidebar === true)
}

// Get all items for a specific category
export function getItemsByCategory(category: NavigationCategory): NavigationItem[] {
  return getAllItems().filter(item => item.category === category)
}

// Get item by ID
export function getItemById(id: string): NavigationItem | undefined {
  return getAllItems().find(item => item.id === id)
}

// Get item by href
export function getItemByHref(href: string): NavigationItem | undefined {
  return getAllItems().find(item => item.href === href)
}

// Get all parent items (items with children)
export function getParentItems(): NavigationItem[] {
  return navigationStructure.filter(item => item.children && item.children.length > 0)
}

// Get breadcrumb trail for a given route
export function getBreadcrumbs(href: string): NavigationItem[] {
  const breadcrumbs: NavigationItem[] = []
  let currentItem = getItemByHref(href)
  
  while (currentItem) {
    breadcrumbs.unshift(currentItem)
    if (currentItem.parent) {
      currentItem = getItemById(currentItem.parent)
    } else {
      break
    }
  }
  
  // Always add home if not already present
  if (breadcrumbs.length === 0 || breadcrumbs[0].id !== 'home') {
    const home = getItemById('home')
    if (home) {
      breadcrumbs.unshift(home)
    }
  }
  
  return breadcrumbs
}

// Flatten nested structure
function getAllItems(): NavigationItem[] {
  const items: NavigationItem[] = []
  
  function traverse(navItems: NavigationItem[]) {
    for (const item of navItems) {
      items.push(item)
      if (item.children) {
        traverse(item.children)
      }
    }
  }
  
  traverse(navigationStructure)
  return items
}

// Check if user can access item
export function canAccessItem(
  item: NavigationItem,
  userRole?: string,
  userPermissions?: string[]
): boolean {
  // Public items
  if (item.roles?.includes('*')) {
    return true
  }
  
  // Requires authentication
  if (item.requiresAuth && !userRole) {
    return false
  }
  
  // Check role
  if (item.roles && userRole && !item.roles.includes(userRole)) {
    return false
  }
  
  // Check permissions
  if (item.permissions && userPermissions) {
    return item.permissions.some(p => userPermissions.includes(p))
  }
  
  return true
}

// Get accessible items for user
export function getAccessibleItems(
  userRole?: string,
  userPermissions?: string[]
): NavigationItem[] {
  return getAllItems().filter(item => 
    canAccessItem(item, userRole, userPermissions)
  )
}

// Sort items by order
export function sortByOrder(items: NavigationItem[]): NavigationItem[] {
  return [...items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}