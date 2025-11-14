import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navigation } from '@/components/Navigation'
import { ToastProvider } from '@/components/ToastProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NavigationProvider } from '@/contexts/NavigationContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'No Time To Lie - Living Knowledge Infrastructure',
  description: 'Create, organize, and share modular knowledge with powerful AI-assisted tools. Built for accuracy, collaboration, and perpetual relevance.',
  keywords: ['knowledge management', 'learning paths', 'AI-powered', 'education', 'collaboration'],
  authors: [{ name: 'No Time To Lie' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <NavigationProvider>
              <ToastProvider>
                <div className="relative min-h-screen bg-background text-foreground">
                  <Navigation />
                  <main className="relative">{children}</main>
                </div>
              </ToastProvider>
            </NavigationProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}