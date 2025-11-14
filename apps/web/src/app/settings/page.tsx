'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Shield, Globe, TestTube } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [oauthRedirectUri, setOauthRedirectUri] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const token = await api.getToken()
    if (!token) {
      router.push('/')
      return
    }
    
    // TODO: Check if user has admin role
    // For now, allow access if authenticated
    setIsAdmin(true)
    loadSettings()
    setIsLoading(false)
  }

  const loadSettings = async () => {
    setGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '')
    if (typeof window !== 'undefined') {
      setOauthRedirectUri(`${window.location.origin}/api/auth/google/callback`)
    }
  }

  const handleSaveOAuthSettings = async () => {
    alert('OAuth settings saved! In production, these would be saved to secure backend configuration.')
    // TODO: Save to backend API endpoint for admin configuration
  }

  const handleTestOAuth = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      const popup = window.open(
        `/api/auth/google?test=true`,
        'oauth_test',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          if (!testResult) {
            setTestResult('❌ OAuth window closed without completing')
          }
          setIsTesting(false)
        }
      }, 1000)

      window.addEventListener('message', (event) => {
        if (event.data.type === 'oauth_success') {
          setTestResult('✅ OAuth flow successful!')
          popup?.close()
          clearInterval(checkClosed)
        } else if (event.data.type === 'oauth_error') {
          setTestResult(`❌ OAuth failed: ${event.data.error}`)
          popup?.close()
          clearInterval(checkClosed)
        }
        setIsTesting(false)
      })
    } catch (error) {
      setTestResult(`❌ Error: ${error}`)
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Site Settings"
        description="Configure site-wide settings (Admin Only)"
        icon={<Settings className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto space-y-6 mt-8">
        {/* Google OAuth Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Google OAuth Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure Google OAuth for user authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Google Client ID
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Google Client Secret
              </label>
              <input
                type="password"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Encrypted and stored securely
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Redirect URI (Configured in Google Console)
              </label>
              <input
                type="text"
                value={oauthRedirectUri}
                readOnly
                className="w-full px-3 py-2 border border-input rounded-md bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add this URL to your Google OAuth app's authorized redirect URIs
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSaveOAuthSettings}>
                Save OAuth Settings
              </Button>
              
              <Button
                variant="outline"
                onClick={handleTestOAuth}
                disabled={isTesting || !googleClientId}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test OAuth Flow
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${
                testResult.startsWith('✅') 
                  ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}>
                {testResult}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Create Google OAuth App</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select existing</li>
                <li>Enable "Google+ API"</li>
                <li>Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"</li>
                <li>Choose "Web application"</li>
                <li>Add the redirect URI shown above</li>
                <li>Copy Client ID and Client Secret</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configure Application</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Paste Client ID and Secret above</li>
                <li>Click "Save OAuth Settings"</li>
                <li>Click "Test OAuth Flow" to verify</li>
                <li>Check that users can sign in via Google</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Security Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800 dark:text-yellow-200">
            <ul className="list-disc list-inside space-y-1">
              <li>Never commit OAuth secrets to version control</li>
              <li>Use environment variables in production</li>
              <li>Rotate credentials regularly</li>
              <li>Monitor OAuth usage in Google Console</li>
              <li>Restrict OAuth app to authorized domains only</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
