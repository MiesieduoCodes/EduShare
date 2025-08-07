"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, Calendar, Eye, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { getPDFs, incrementDownloadCount, PDFDocument } from '@/lib/firestore'
import Link from 'next/link'

export function RecentPDFs() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    loadPDFs()
  }, [isOnline])

  const loadPDFs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const allPdfs = await getPDFs()
      setPdfs(allPdfs.slice(0, 6)) // Show only recent 6
      
      // Update hero stats dynamically
      updateHeroStats(allPdfs)
    } catch (error: any) {
      console.error('Error loading PDFs:', error)
      setError(error.message || 'Failed to load resources')
      // Set empty array on error
      setPdfs([])
    } finally {
      setLoading(false)
    }
  }

  const updateHeroStats = (allPdfs: PDFDocument[]) => {
    // Update hero section stats with real data
    const totalResources = allPdfs.length
    const totalDownloads = allPdfs.reduce((sum, pdf) => sum + pdf.downloads, 0)
    
    // Update DOM elements if they exist
    const resourcesElement = document.getElementById('total-resources')
    const downloadsElement = document.getElementById('total-downloads')
    
    if (resourcesElement) {
      resourcesElement.textContent = totalResources.toString()
    }
    if (downloadsElement) {
      downloadsElement.textContent = totalDownloads.toLocaleString()
    }
  }

  const handleDownload = async (pdf: PDFDocument) => {
    try {
      if (pdf.id && isOnline) {
        // Only increment if online
        await incrementDownloadCount(pdf.id)
        // Update local state optimistically
        setPdfs(prev => prev.map(p => 
          p.id === pdf.id ? { ...p, downloads: p.downloads + 1 } : p
        ))
      }
      // Always allow download
      window.open(pdf.downloadURL, '_blank')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // Still allow download even if count update fails
      window.open(pdf.downloadURL, '_blank')
    }
  }

  const handleRetry = () => {
    loadPDFs()
  }

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading resources...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Recently Uploaded <span className="text-orange">Resources</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access the latest educational materials uploaded by your instructors
          </p>
        </div>

        {/* Connection Status */}
        {!isOnline && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              You're currently offline. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {pdfs.length === 0 && !loading && !error ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No resources available</h3>
            <p className="text-muted-foreground mb-4">
              {!isOnline 
                ? "Please check your internet connection and try again."
                : "Check back later for new educational materials"
              }
            </p>
            {!isOnline && (
              <Button variant="outline" onClick={handleRetry}>
                <Wifi className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfs.map((pdf) => (
                <Card key={pdf.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-blue mb-2" />
                      <Badge variant="secondary" className="text-xs">
                        {pdf.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight group-hover:text-orange transition-colors">
                      {pdf.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pdf.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {pdf.uploadDate.toDate().toLocaleDateString()}
                      </div>
                      <div className="text-right">
                        <div>{(pdf.fileSize / 1024 / 1024).toFixed(1)} MB</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Download className="h-3 w-3 mr-1" />
                        {pdf.downloads} downloads
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 px-3">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 px-3 bg-blue hover:bg-blue/90"
                          onClick={() => handleDownload(pdf)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pdfs.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/history">View All Resources</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
