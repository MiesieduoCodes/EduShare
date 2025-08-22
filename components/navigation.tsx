"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, FileText, Menu, X, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export function Navigation() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLecturer, signOut } = useAuth()

  const publicNavItems = [
    { href: '/', label: 'Home' },
    { href: '/history', label: 'Resources' },
    { href: '/contact', label: 'Contact' },
  ]

  const adminNavItems = [
    ...publicNavItems,
    { href: '/admin', label: 'Admin Dashboard' },
  ]

  const navItems = isLecturer ? adminNavItems : publicNavItems

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue" />
            <span className="text-xl font-bold">
              Edu<span className="text-orange">Share</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-orange ${
                  pathname === item.href
                    ? 'text-orange border-b-2 border-orange'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle & Authentication */}
          <div className="flex items-center space-x-2">
            {isLecturer ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:block">
                  <User className="h-4 w-4 inline mr-1" />
                  Admin
                </span>
                <Button variant="ghost" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/login">
                  <User className="h-4 w-4 mr-1" />
                  Admin Login
                </Link>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors hover:text-orange ${
                    pathname === item.href ? 'text-orange' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {!isLecturer && (
                <Link
                  href="/admin/login"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-orange"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
