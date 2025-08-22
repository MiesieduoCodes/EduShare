"use client"

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { UploadSection } from '@/components/upload-section'
import { UploadHistory } from '@/components/upload-history'
import { ProfileSection } from '@/components/profile-section'
import { AuthGuard } from '@/components/auth-guard'

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('upload')

  const renderContent = () => {
    switch (activeSection) {
      case 'upload':
        return <UploadSection />
      case 'history':
        return <UploadHistory />
      case 'profile':
        return <ProfileSection />
      default:
        return <UploadSection />
    }
  }

  return (
    <AuthGuard requireLecturer>
      <div className="min-h-screen bg-muted/30">
        <div className="flex">
          <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="flex-1 p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
