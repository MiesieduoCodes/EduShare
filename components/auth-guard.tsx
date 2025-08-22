"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireLecturer?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireLecturer = false, redirectTo = '/admin/login' }: AuthGuardProps) {
  const { user, isLecturer, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireLecturer) {
      if (!user || !isLecturer) {
        router.push(redirectTo)
        return
      }
    }
  }, [user, isLecturer, loading, router, redirectTo, requireLecturer])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requireLecturer && (!user || !isLecturer)) {
    return null
  }

  return <>{children}</>
}
