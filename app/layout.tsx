import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { AuthProvider } from '@/lib/auth-context'
import { ConnectionStatus } from '@/components/connection-status'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduShare - PDF Sharing Platform',
  description: 'A modern platform for lecturers to share PDF files with students',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navigation />
            <ConnectionStatus />
            <main className="min-h-screen bg-background">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
