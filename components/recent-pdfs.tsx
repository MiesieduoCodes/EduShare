"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, Calendar, Eye, Loader2, AlertCircle, Wifi, WifiOff, Video, Presentation, ExternalLink, Play } from 'lucide-react'
import { getContent, incrementDownloadCount, incrementViewCount, ContentDocument, ContentType, VisibilityLevel } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'
import { StudentDownloadForm } from '@/components/student-download-form'
import Link from 'next/link'

export function RecentPDFs() {
  const [content, setContent] = useState<ContentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [selectedContent, setSelectedContent] = useState<ContentDocument | null>(null)
  const [showDownloadForm, setShowDownloadForm] = useState(false)
  const { isLecturer } = useAuth()

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
    loadContent()
  }, [isOnline, isLecturer])

  const loadContent = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const allContent = await getContent(isLecturer)
      setContent(allContent.slice(0, 6)) // Show only recent 6
      
      // Update hero stats dynamically
      updateHeroStats(allContent)
    } catch (error: any) {
      console.error('Error loading content:', error)
      setError(error.message || 'Failed to load resources')
      // Set empty array on error
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  const updateHeroStats = (allContent: ContentDocument[]) => {
    // Update hero section stats with real data
    const totalResources = allContent.length
    const totalDownloads = allContent.reduce((sum, item) => sum + item.downloads, 0)
    
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

  const handleDownload = async (item: ContentDocument) => {
    // For lecturers, allow direct download
    if (isLecturer) {
      try {
        if (item.id && isOnline) {
          await incrementDownloadCount(item.id)
          setContent(prev => prev.map(p => 
            p.id === item.id ? { ...p, downloads: p.downloads + 1 } : p
          ))
        }
        if (item.downloadURL) {
          window.open(item.downloadURL, '_blank')
        }
      } catch (error) {
        console.error('Error downloading content:', error)
        if (item.downloadURL) {
          window.open(item.downloadURL, '_blank')
        }
      }
    } else {
      // For students, show the download form
      setSelectedContent(item)
      setShowDownloadForm(true)
    }
  }

  const handleDownloadSuccess = () => {
    // Update the content state to reflect the new download count
    if (selectedContent?.id) {
      setContent(prev => prev.map(p => 
        p.id === selectedContent.id ? { ...p, downloads: p.downloads + 1 } : p
      ))
    }
  }

  const handleView = async (item: ContentDocument) => {
    try {
      if (item.id && isOnline) {
        await incrementViewCount(item.id)
        // Update local state optimistically
        setContent(prev => prev.map(p => 
          p.id === item.id ? { ...p, views: p.views + 1 } : p
        ))
      }
      
      if (item.contentType === ContentType.VIDEO && item.videoURL) {
        window.open(item.videoURL, '_blank')
      } else if (item.downloadURL) {
        window.open(item.downloadURL, '_blank')
      }
    } catch (error) {
      console.error('Error viewing content:', error)
      // Still allow view even if count update fails
      if (item.contentType === ContentType.VIDEO && item.videoURL) {
        window.open(item.videoURL, '_blank')
      } else if (item.downloadURL) {
        window.open(item.downloadURL, '_blank')
      }
    }
  }

  const handleRetry = () => {
    loadContent()
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
            Recently Uploaded <span className="text-orange">Content</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access the latest PDFs, videos, and presentations uploaded by your instructors
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

        {content.length === 0 && !loading && !error ? (
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
              {content.map((item) => {
                const getContentIcon = () => {
                  switch (item.contentType) {
                    case ContentType.PDF:
                      return <FileText className="h-8 w-8 text-blue mb-2" />
                    case ContentType.VIDEO:
                      return <Video className="h-8 w-8 text-red-500 mb-2" />
                    case ContentType.POWERPOINT:
                      return <Presentation className="h-8 w-8 text-orange mb-2" />
                    default:
                      return <FileText className="h-8 w-8 text-blue mb-2" />
                  }
                }

                const getContentSize = () => {
                  if (item.contentType === ContentType.VIDEO) {
                    return item.videoDuration ? `${Math.floor(item.videoDuration / 60)}:${(item.videoDuration % 60).toString().padStart(2, '0')}` : 'Video'
                  }
                  return item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'
                }

                return (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        {getContentIcon()}
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.visibility === VisibilityLevel.LECTURER_ONLY && (
                            <Badge variant="outline" className="text-xs border-orange text-orange">
                              Lecturer Only
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{item.courseTitle}</p>
                        <CardTitle className="text-lg leading-tight group-hover:text-orange transition-colors">
                          {item.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.uploadDate.toDate().toLocaleDateString()}
                        </div>
                        <div className="text-right">
                          <div>{getContentSize()}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-xs text-muted-foreground space-x-3">
                          <div className="flex items-center">
                            <Download className="h-3 w-3 mr-1" />
                            {item.downloads}
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {item.views}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3"
                            onClick={() => handleView(item)}
                          >
                            {item.contentType === ContentType.VIDEO ? (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Watch
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </>
                            )}
                          </Button>
                          {(item.downloadURL || item.contentType === ContentType.VIDEO) && (
                            <Button 
                              size="sm" 
                              className="h-8 px-3 bg-blue hover:bg-blue/90"
                              onClick={() => item.contentType === ContentType.VIDEO ? handleView(item) : handleDownload(item)}
                            >
                              {item.contentType === ContentType.VIDEO ? (
                                <>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  {isLecturer ? 'Download' : 'Request'}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {content.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/history">View All Resources</Link>
                </Button>
              </div>
            )}
          </>
        )}
        
        {/* Student Download Form */}
        {selectedContent && (
          <StudentDownloadForm
            content={selectedContent}
            isOpen={showDownloadForm}
            onClose={() => {
              setShowDownloadForm(false)
              setSelectedContent(null)
            }}
            onDownloadSuccess={handleDownloadSuccess}
          />
        )}
      </div>
    </section>
  )
}
