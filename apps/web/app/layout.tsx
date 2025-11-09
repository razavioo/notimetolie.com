import './globals.css'

export const metadata = {
  title: 'No Time To Lie',
  description: 'Living Knowledge Infrastructure',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

