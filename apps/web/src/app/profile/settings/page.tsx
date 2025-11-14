'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Mail, Shield, Eye, EyeOff, Bell, Globe, Palette } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, hasRole } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Profile settings
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(false)
  const [language, setLanguage] = useState('en')
  
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin')
      return
    }
    
    if (user) {
      loadUserSettings()
    }
  }, [authLoading, isAuthenticated, user, router])

  const loadUserSettings = () => {
    if (!user) return
    
    setFullName(user.full_name || '')
    setEmail(user.email || '')
    setUsername(user.username || '')
    
    // Load preferences from user metadata if available
    if (user.metadata) {
      setEmailNotifications(user.metadata.emailNotifications ?? true)
      setPublicProfile(user.metadata.publicProfile ?? false)
      setLanguage(user.metadata.language ?? 'en')
    }
    
    setIsLoading(false)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      const token = await api.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email
        })
      })
      
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        const error = await response.json()
        setSaveMessage({ type: 'error', text: error.detail || 'Failed to update profile' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred while updating profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    
    if (newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }
    
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      const token = await api.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })
      
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Password changed successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        setSaveMessage({ type: 'error', text: error.detail || 'Failed to change password' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred while changing password' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      const token = await api.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/preferences`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailNotifications,
          publicProfile,
          language
        })
      })
      
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' })
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save preferences' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred while saving preferences' })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Profile Settings"
        description="Manage your account preferences and privacy"
        icon={<Settings className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto space-y-6 mt-8">
        {/* Save Message */}
        {saveMessage && (
          <div className={`p-4 rounded-md ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Navigate to other settings pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-4"
                onClick={() => router.push('/profile')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">Profile</div>
                  <div className="text-xs text-muted-foreground">
                    View your profile and statistics
                  </div>
                </div>
              </Button>
              
              {hasRole(['admin']) && (
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4 px-4"
                  onClick={() => router.push('/settings')}
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">Site Settings</div>
                    <div className="text-xs text-muted-foreground">
                      Configure site-wide settings (Admin only)
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full px-3 py-2 border border-input rounded-md bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Username cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSaving ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-xs text-muted-foreground">Receive updates via email</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Public Profile</div>
                  <div className="text-xs text-muted-foreground">Make your profile visible to others</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfile}
                  onChange={(e) => setPublicProfile(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Globe className="h-4 w-4 inline mr-2" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <Button onClick={handleSavePreferences} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Information (Read-only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>
              Your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Role</div>
              <div className="text-lg capitalize">
                {user.role?.replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Level & XP</div>
              <div className="text-lg">Level {user.level} ({user.xp} XP)</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Member Since</div>
              <div className="text-lg">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
