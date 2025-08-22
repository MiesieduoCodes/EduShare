"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Download, Eye, Trash2, Edit, Loader2, BarChart3 } from 'lucide-react'
import { getPDFs, deletePDF, PDFDocument } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'

export function UploadHistory() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  
  const { user } = useAuth()

  useEffect(() => {
    loadPDFs()
  }, [user])

  const loadPDFs = async () => {
    try {
      const allPdfs = await getPDFs()
      // Filter PDFs uploaded by current user
      const userPdfs = allPdfs.filter(pdf => pdf.uploadedBy === user?.email)
      setPdfs(userPdfs)
    } catch (error) {
      console.error('Error loading PDFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = pdfs.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (pdf: PDFDocument) => {
    if (!pdf.id) return
    
    setDeleteLoading(pdf.id)
    try {
      await deletePDF(pdf.id, pdf.downloadURL)
      setPdfs(prev => prev.filter(p => p.id !== pdf.id))
    } catch (error) {
      console.error('Error deleting PDF:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handlePreview = (pdf: PDFDocument) => {
    window.open(pdf.downloadURL, '_blank')
  }

  // Calculate real stats
  const totalDownloads = pdfs.reduce((sum, pdf) => sum + pdf.downloads, 0)
  const totalSize = pdfs.reduce((sum, pdf) => sum + pdf.fileSize, 0)
  const thisMonthUploads = pdfs.filter(pdf => {
    const uploadDate = pdf.uploadDate.toDate()
    const now = new Date()
    return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
  }).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Upload <span className="text-orange">History</span>
        </h1>
        <p className="text-muted-foreground">
          Manage and track your uploaded resources
        </p>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold text-blue">{pdfs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold text-orange">{totalDownloads.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-orange/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue">{thisMonthUploads}</p>
              </div>
              <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-orange">
                  {totalSize > 0 ? (totalSize / 1024 / 1024).toFixed(1) : '0'} MB
                </p>
              </div>
              <div className="w-12 h-12 bg-orange/10 rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upload History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {pdfs.length === 0 ? 'No files uploaded yet' : 'No files found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{item.uploadDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{item.downloads}</TableCell>
                    <TableCell>{(item.fileSize / 1024 / 1024).toFixed(1)} MB</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handlePreview(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete PDF</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{item.title}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDelete(item)}
                                disabled={deleteLoading === item.id}
                              >
                                {deleteLoading === item.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
