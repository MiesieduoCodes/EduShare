"use client"

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: { email: string } | null
  isLecturer: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple local authentication - no Firebase Auth needed
const ADMIN_CREDENTIALS = {
  email: 'admin@admin.com',
  password: 'edushare@123'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [isLecturer, setIsLecturer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('edushare_admin')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsLecturer(true)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('edushare_admin')
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email)
    setError(null)
    setLoading(true)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      // Check credentials against hardcoded admin credentials
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const userData = { email }
        setUser(userData)
        setIsLecturer(true)
        
        // Save to localStorage for persistence
        localStorage.setItem('edushare_admin', JSON.stringify(userData))
        
        console.log('Sign in successful:', email)
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      let errorMessage = 'Invalid email or password.'
      
      if (error.message === 'Invalid credentials') {
        errorMessage = 'Invalid email or password.'
      } else {
        errorMessage = 'Sign in failed. Please try again.'
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      setUser(null)
      setIsLecturer(false)
      localStorage.removeItem('edushare_admin')
      console.log('Sign out successful')
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLecturer,
      loading,
      error,
      signIn,
      signOut,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
