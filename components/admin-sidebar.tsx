"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, History, User, FileText, BarChart3, Loader2 } from 'lucide-react'
import { getPDFs, PDFDocument } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'

interface AdminSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  const [stats, setStats] = useState({
    totalPDFs: 0,
    totalDownloads: 0,
    thisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      const pdfs = await getPDFs()
      
      // Filter PDFs uploaded by current user
      const userPdfs = pdfs.filter(pdf => pdf.uploadedBy === user?.email)
      
      // Calculate total downloads
      const totalDownloads = userPdfs.reduce((sum, pdf) => sum + pdf.downloads, 0)
      
      // Calculate this month's uploads
      const now = new Date()
      const thisMonthUploads = userPdfs.filter(pdf => {
        const uploadDate = pdf.uploadDate.toDate()
        return uploadDate.getMonth() === now.getMonth() && 
               uploadDate.getFullYear() === now.getFullYear()
      }).length
      
      setStats({
        totalPDFs: userPdfs.length,
        totalDownloads,
        thisMonth: thisMonthUploads
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Keep stats at 0 if there's an error
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { id: 'upload', label: 'Upload PDF', icon: Upload },
    { id: 'history', label: 'Upload History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="w-64 min-h-screen bg-card border-r p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="h-6 w-6 text-blue" />
          <span className="text-lg font-bold">Admin Panel</span>
        </div>
        <p className="text-sm text-muted-foreground">Manage your resources</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeSection === item.id 
                  ? 'bg-blue text-white hover:bg-blue/90' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <Card className="mt-8 p-4 bg-gradient-to-br from-blue/10 to-orange/10">
        <div className="flex items-center space-x-2 mb-2">
          <BarChart3 className="h-5 w-5 text-blue" />
          <span className="font-medium">Quick Stats</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total PDFs:</span>
              <span className="font-medium">{stats.totalPDFs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Downloads:</span>
              <span className="font-medium">{stats.totalDownloads.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">This Month:</span>
              <span className="font-medium">{stats.thisMonth}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
