import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  role: 'guest' | 'builder' | 'trusted_builder' | 'moderator' | 'admin'
  xp: number
  level: number
  is_active: boolean
  is_verified: boolean
  metadata?: {
    emailNotifications?: boolean
    publicProfile?: boolean
    language?: string
  }
  created_at?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = api.getToken()
    if (token) {
      const response = await api.getCurrentUser()
      if (response.data) {
        setUser(response.data)
        setIsAuthenticated(true)
      } else {
        api.clearToken()
        setUser(null)
        setIsAuthenticated(false)
      }
    }
    setIsLoading(false)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // All permissions
      moderator: ['view', 'create_blocks', 'create_paths', 'create_suggestions', 'review_suggestions', 'moderate_content', 'use_ai_agents'],
      trusted_builder: ['view', 'create_blocks', 'create_paths', 'create_suggestions', 'review_suggestions', 'use_ai_agents'],
      builder: ['view', 'create_blocks', 'create_paths', 'create_suggestions', 'use_ai_agents'],
      guest: ['view', 'create_suggestions']
    }

    const permissions = rolePermissions[user.role] || []
    return permissions.includes('*') || permissions.includes(permission)
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
    setIsAuthenticated(false)
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
    logout,
    checkAuth
  }
}
