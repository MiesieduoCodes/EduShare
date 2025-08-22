"use client"

import { FirebaseStatus } from '@/components/firebase-status'

export default function FirebaseTestPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Firebase Configuration Test</h1>
          <p className="text-muted-foreground">
            Check if Firebase services are properly configured and accessible
          </p>
        </div>
        
        <FirebaseStatus />
        
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Troubleshooting Steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Verify Firebase project configuration in console</li>
            <li>Check if Authentication is enabled in Firebase Console</li>
            <li>Ensure Firestore database is created</li>
            <li>Verify Storage bucket is set up</li>
            <li>Check browser console for detailed error messages</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
