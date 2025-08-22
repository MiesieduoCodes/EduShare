"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface FirebaseStatus {
  auth: boolean
  firestore: boolean
  storage: boolean
  error?: string
}

export function FirebaseStatus() {
  const [status, setStatus] = useState<FirebaseStatus>({
    auth: false,
    firestore: false,
    storage: false
  })
  const [loading, setLoading] = useState(true)

  const checkFirebaseStatus = async () => {
    setLoading(true)
    const newStatus: FirebaseStatus = {
      auth: false,
      firestore: false,
      storage: false
    }

    try {
      // Check Auth
      const { auth } = await import('@/lib/firebase')
      newStatus.auth = !!auth
      console.log('Auth status:', newStatus.auth)

      // Check Firestore
      const { db } = await import('@/lib/firebase')
      newStatus.firestore = !!db
      console.log('Firestore status:', newStatus.firestore)

      // Check Storage
      const { storage } = await import('@/lib/firebase')
      newStatus.storage = !!storage
      console.log('Storage status:', newStatus.storage)

    } catch (error: any) {
      console.error('Firebase status check failed:', error)
      newStatus.error = error.message
    }

    setStatus(newStatus)
    setLoading(false)
  }

  useEffect(() => {
    checkFirebaseStatus()
  }, [])

  const StatusBadge = ({ service, isActive }: { service: string, isActive: boolean }) => (
    <div className="flex items-center justify-between p-2 border rounded">
      <span className="text-sm font-medium">{service}</span>
      <Badge variant={isActive ? "default" : "destructive"}>
        {isActive ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    </div>
  )

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Firebase Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Checking Firebase services...</p>
          </div>
        ) : (
          <>
            <StatusBadge service="Authentication" isActive={status.auth} />
            <StatusBadge service="Firestore" isActive={status.firestore} />
            <StatusBadge service="Storage" isActive={status.storage} />
            
            {status.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm text-destructive">{status.error}</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={checkFirebaseStatus}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
