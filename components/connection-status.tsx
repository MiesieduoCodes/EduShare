"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      // Hide success message after 3 seconds
      setTimeout(() => setShowStatus(false), 3000)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <Alert className={`${
        isOnline 
          ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' 
          : 'border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800'
      }`}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription className={`${
          isOnline 
            ? 'text-green-800 dark:text-green-200' 
            : 'text-orange-800 dark:text-orange-200'
        }`}>
          {isOnline ? 'Connection restored' : 'You are offline'}
        </AlertDescription>
      </Alert>
    </div>
  )
}
