'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const token = api.getToken()
      if (!token) {
        router.push('/auth/signin')
        return
      }

      const response = await api.getCurrentUser()
      if (response.data) {
        setUser(response.data)
      } else {
        router.push('/auth/signin')
      }
    } catch (error) {
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate level progress
  const currentXP = user.xp || 0
  const currentLevel = user.level || 1
  const nextLevelXP = currentLevel * 100 // Simple formula
  const progressPercent = Math.min((currentXP % 100) / 100 * 100, 100)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border rounded-lg shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.full_name || user.username}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-lg">
                <span className="text-2xl font-bold text-primary">Level {currentLevel}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-background border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Experience Points</div>
              <div className="text-2xl font-bold">{currentXP} XP</div>
            </div>
            <div className="bg-background border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Current Level</div>
              <div className="text-2xl font-bold">Level {currentLevel}</div>
            </div>
            <div className="bg-background border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Account Status</div>
              <div className="text-2xl font-bold">
                {user.is_verified ? (
                  <span className="text-green-600">Verified ✓</span>
                ) : (
                  <span className="text-yellow-600">Unverified</span>
                )}
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress to Level {currentLevel + 1}</span>
              <span className="text-sm text-muted-foreground">
                {currentXP % 100} / 100 XP
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Account Details */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Account Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {new Date(user.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">
                  {user.role || 'Builder'}
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Info */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">How to Earn XP</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span>Create a new block</span>
                <span className="font-bold text-primary">+10 XP</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Suggest an edit (approved)</span>
                <span className="font-bold text-primary">+5 XP</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Create a path</span>
                <span className="font-bold text-primary">+15 XP</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Daily login streak</span>
                <span className="font-bold text-primary">+2 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
