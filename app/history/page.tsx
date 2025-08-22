"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Download, FileText, Calendar, Filter, Loader2, Video, Presentation, Eye, Play, ExternalLink } from 'lucide-react'
import { getContent, incrementDownloadCount, ContentDocument, ContentType, VisibilityLevel } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'
import { StudentDownloadForm } from '@/components/student-download-form'

export default function HistoryPage() {
  const [content, setContent] = useState<ContentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [contentTypeFilter, setContentTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [selectedContent, setSelectedContent] = useState<ContentDocument | null>(null)
  const [showDownloadForm, setShowDownloadForm] = useState(false)
  const { isLecturer } = useAuth()

  useEffect(() => {
    loadContent()
  }, [isLecturer])

  const loadContent = async () => {
    try {
      const allContent = await getContent(isLecturer)
      setContent(allContent)
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(content.map(item => item.category)))]
  const contentTypes = [
    { value: 'all', label: 'All Types' },
    { value: ContentType.PDF, label: 'PDFs' },
    { value: ContentType.VIDEO, label: 'Videos' },
    { value: ContentType.POWERPOINT, label: 'PowerPoints' }
  ]

  const filteredContent = content
    .filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
    .filter(item => contentTypeFilter === 'all' || item.contentType === contentTypeFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.uploadDate.toMillis() - a.uploadDate.toMillis()
      } else if (sortBy === 'downloads') {
        return b.downloads - a.downloads
      } else if (sortBy === 'views') {
        return b.views - a.views
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  const handleDownload = async (item: ContentDocument) => {
    // For lecturers, allow direct download
    if (isLecturer) {
      try {
        if (item.id) {
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
    if (selectedContent?.id) {
      setContent(prev => prev.map(p => 
        p.id === selectedContent.id ? { ...p, downloads: p.downloads + 1 } : p
      ))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading resources...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Content <span className="text-orange">Library</span>
          </h1>
          <p className="text-muted-foreground">
            Browse and search through all educational content including PDFs, videos, and presentations
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="downloads">Downloads</SelectItem>
                    <SelectItem value="views">Views</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredContent.length} of {content.length} resources
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => {
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
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
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
                      {item.contentType === ContentType.VIDEO ? (
                        <Button 
                          size="sm" 
                          className="bg-blue hover:bg-blue/90"
                          onClick={() => window.open(item.videoURL, '_blank')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-blue hover:bg-blue/90" 
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {isLecturer ? 'Download' : 'Request'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
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
    </div>
  )
}
