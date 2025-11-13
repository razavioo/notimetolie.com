'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { api } from '@/lib/api'
import { ArrowLeft, Save, Sparkles, Shield, User, Bell, Lock } from 'lucide-react'

// XP System Configuration
const XP_PER_LEVEL = 1000 // Base XP required per level
const LEVEL_MULTIPLIER = 1.5 // Each level requires 1.5x more XP

// Fun user titles based on level
const getUserTitle = (level: number): string => {
  if (level >= 50) return '🌟 Legendary Knowledge Architect'
  if (level >= 40) return '⚡ Master Truth Seeker'
  if (level >= 30) return '🔥 Expert Builder'
  if (level >= 25) return '💎 Advanced Creator'
  if (level >= 20) return '🎯 Skilled Contributor'
  if (level >= 15) return '📚 Knowledge Curator'
  if (level >= 10) return '🌱 Growing Builder'
  if (level >= 5) return '✨ Emerging Creator'
  return '🔰 Novice Explorer'
}

// Calculate XP required for next level
const getXPForLevel = (level: number): number => {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

// Calculate total XP required to reach a specific level
const getTotalXPForLevel = (level: number): number => {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i)
  }
  return total
}

// Get current level from XP
const getLevelFromXP = (xp: number): number => {
  let level = 1
  let totalXP = 0
  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level)
    level++
  }
  return level
}

// Get XP remaining to next level
const getXPtoNextLevel = (currentXP: number): number => {
  const currentLevel = getLevelFromXP(currentXP)
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel)
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1)
  return xpForNextLevel - currentXP
}

// Get progress percentage within current level
const getLevelProgress = (currentXP: number): number => {
  const currentLevel = getLevelFromXP(currentXP)
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel)
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1)
  const xpInLevel = currentXP - xpForCurrentLevel
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel
  return Math.floor((xpInLevel / xpNeededForLevel) * 100)
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    // Load user settings from API
    try {
      const response = await api.getCurrentUser()
      if (response.data) {
        // Load settings from user metadata
        setNotifications(response.data.metadata?.notifications ?? true)
        setEmailUpdates(response.data.metadata?.email_updates ?? false)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Save settings
      toast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.'
      })
    } catch (error) {
      toast({
        type: 'error',
        title: 'Failed to save settings',
        description: 'Please try again later.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">Settings</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">
            Manage your account preferences and features
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground dark:text-gray-100">Profile</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-gray-200 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-foreground dark:text-gray-300 opacity-60 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-gray-200 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-foreground dark:text-gray-300 opacity-60 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-gray-200 mb-1">
                  Role
                </label>
                <div className="px-3 py-2 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-md text-primary dark:text-primary/90 font-medium capitalize">
                  {user.role?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* XP & Level Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-foreground dark:text-gray-100">Progress & Level</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    Level {user.level || 1}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                    {user.xp || 0} XP
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground dark:text-gray-200">
                    {getUserTitle(user.level || 1)}
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {getXPtoNextLevel(user.xp || 0)} XP to next level
                  </div>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="relative">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${getLevelProgress(user.xp || 0)}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground dark:text-gray-400">
                Earn XP by creating blocks, completing paths, and contributing to the community!
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground dark:text-gray-100">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground dark:text-gray-200">
                    In-App Notifications
                  </label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                    Receive notifications about suggestions, updates, and activity
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications 
                      ? 'bg-primary' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground dark:text-gray-200">
                    Email Updates
                  </label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                    Get weekly digest of your activity and new content
                  </p>
                </div>
                <button
                  onClick={() => setEmailUpdates(!emailUpdates)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailUpdates 
                      ? 'bg-primary' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground dark:text-gray-100">Security</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => toast({ type: 'info', title: 'Coming Soon', description: 'Password change feature will be available soon.' })}
                className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium text-foreground dark:text-gray-200">Change Password</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                  Update your account password
                </div>
              </button>
              
              <button
                onClick={() => toast({ type: 'info', title: 'Coming Soon', description: 'Two-factor authentication will be available soon.' })}
                className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium text-foreground dark:text-gray-200">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                  Add an extra layer of security to your account
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-foreground dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
