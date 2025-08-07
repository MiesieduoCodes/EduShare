"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Download, FileText, Calendar, Filter, Loader2 } from 'lucide-react'
import { getPDFs, incrementDownloadCount, PDFDocument } from '@/lib/firestore'

export default function HistoryPage() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    loadPDFs()
  }, [])

  const loadPDFs = async () => {
    try {
      const allPdfs = await getPDFs()
      setPdfs(allPdfs)
    } catch (error) {
      console.error('Error loading PDFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(pdfs.map(pdf => pdf.category)))]

  const filteredPDFs = pdfs
    .filter(pdf => 
      pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pdf.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(pdf => categoryFilter === 'all' || pdf.category === categoryFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.uploadDate.toMillis() - a.uploadDate.toMillis()
      } else if (sortBy === 'downloads') {
        return b.downloads - a.downloads
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  const handleDownload = async (pdf: PDFDocument) => {
    try {
      if (pdf.id) {
        await incrementDownloadCount(pdf.id)
        // Update local state
        setPdfs(prev => prev.map(p => 
          p.id === pdf.id ? { ...p, downloads: p.downloads + 1 } : p
        ))
      }
      window.open(pdf.downloadURL, '_blank')
    } catch (error) {
      console.error('Error downloading PDF:', error)
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
            Resource <span className="text-orange">History</span>
          </h1>
          <p className="text-muted-foreground">
            Browse and search through all uploaded PDF resources
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
            Showing {filteredPDFs.length} of {pdfs.length} resources
          </p>
        </div>

        {/* PDF Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPDFs.map((pdf) => (
            <Card key={pdf.id} className="group hover:shadow-lg transition-all duration-300">
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
                    <div>{pdf.size}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Download className="h-3 w-3 mr-1" />
                    {pdf.downloads} downloads
                  </div>
                  <Button size="sm" className="bg-blue hover:bg-blue/90" onClick={() => handleDownload(pdf)}>
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPDFs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
