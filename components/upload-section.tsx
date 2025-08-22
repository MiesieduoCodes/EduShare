"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, X, Loader2, CheckCircle, Video, Presentation, Eye, EyeOff, BookOpen } from 'lucide-react'
import { uploadContent, ContentType, VisibilityLevel } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'

export function UploadSection() {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [contentType, setContentType] = useState<ContentType>(ContentType.PDF)
  const [visibility, setVisibility] = useState<VisibilityLevel>(VisibilityLevel.PUBLIC)
  const [videoURL, setVideoURL] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  const { user } = useAuth()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      if (contentType === ContentType.PDF) {
        return file.type === 'application/pdf'
      } else if (contentType === ContentType.POWERPOINT) {
        return file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')
      }
      return false
    })
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => {
        if (contentType === ContentType.PDF) {
          return file.type === 'application/pdf'
        } else if (contentType === ContentType.POWERPOINT) {
          return file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')
        }
        return false
      })
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!user || !title || !description || !courseTitle || !courseDescription || !category) {
      return
    }

    // Validate based on content type
    if (contentType === ContentType.VIDEO && !videoURL) {
      return
    }
    if ((contentType === ContentType.PDF || contentType === ContentType.POWERPOINT) && files.length === 0) {
      return
    }

    setUploading(true)
    setUploadSuccess(false)

    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      
      if (contentType === ContentType.VIDEO) {
        // Upload video link
        await uploadContent(null, {
          title,
          description,
          courseTitle,
          courseDescription,
          category,
          tags: tagsArray,
          contentType,
          visibility,
          videoURL,
          uploadedBy: user.email
        })
      } else {
        // Upload files (PDF or PowerPoint)
        for (const file of files) {
          await uploadContent(file, {
            title,
            description,
            courseTitle,
            courseDescription,
            category,
            tags: tagsArray,
            contentType,
            visibility,
            uploadedBy: user.email
          })
        }
      }

      // Reset form
      setFiles([])
      setTitle('')
      setDescription('')
      setCourseTitle('')
      setCourseDescription('')
      setCategory('')
      setTags('')
      setVideoURL('')
      setUploadSuccess(true)
      
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Upload <span className="text-orange">Educational Content</span>
        </h1>
        <p className="text-muted-foreground">
          Share PDFs, videos, and PowerPoint presentations with your students
        </p>
      </div>

      {uploadSuccess && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Upload successful!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Content Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={contentType === ContentType.PDF ? "default" : "outline"}
                onClick={() => {
                  setContentType(ContentType.PDF)
                  setFiles([])
                  setVideoURL('')
                }}
                className="flex flex-col h-20 space-y-1"
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs">PDF</span>
              </Button>
              <Button
                variant={contentType === ContentType.VIDEO ? "default" : "outline"}
                onClick={() => {
                  setContentType(ContentType.VIDEO)
                  setFiles([])
                }}
                className="flex flex-col h-20 space-y-1"
              >
                <Video className="h-6 w-6" />
                <span className="text-xs">Video</span>
              </Button>
              <Button
                variant={contentType === ContentType.POWERPOINT ? "default" : "outline"}
                onClick={() => {
                  setContentType(ContentType.POWERPOINT)
                  setFiles([])
                  setVideoURL('')
                }}
                className="flex flex-col h-20 space-y-1"
              >
                <Presentation className="h-6 w-6" />
                <span className="text-xs">PowerPoint</span>
              </Button>
            </div>

            {/* Visibility Control */}
            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex space-x-2">
                <Button
                  variant={visibility === VisibilityLevel.PUBLIC ? "default" : "outline"}
                  onClick={() => setVisibility(VisibilityLevel.PUBLIC)}
                  className="flex-1"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Public
                </Button>
                <Button
                  variant={visibility === VisibilityLevel.LECTURER_ONLY ? "default" : "outline"}
                  onClick={() => setVisibility(VisibilityLevel.LECTURER_ONLY)}
                  className="flex-1"
                  size="sm"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Lecturer Only
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {visibility === VisibilityLevel.PUBLIC 
                  ? "Students and lecturers can see this content" 
                  : "Only lecturers can see this content"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>
              {contentType === ContentType.VIDEO ? 'Video Link' : 'Upload Files'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentType === ContentType.VIDEO ? (
              <div className="space-y-2">
                <Label htmlFor="videoURL">Video URL *</Label>
                <Input 
                  id="videoURL" 
                  placeholder="Enter YouTube, Vimeo, or other video URL" 
                  value={videoURL}
                  onChange={(e) => setVideoURL(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Supported: YouTube, Vimeo, and direct video links
                </p>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue bg-blue/5' 
                    : 'border-muted-foreground/25 hover:border-blue/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {contentType === ContentType.PDF ? (
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                ) : (
                  <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                )}
                <p className="text-lg font-medium mb-2">
                  Drag and drop {contentType === ContentType.PDF ? 'PDF' : 'PowerPoint'} files here
                </p>
                <p className="text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <input
                  type="file"
                  multiple
                  accept={contentType === ContentType.PDF ? ".pdf" : ".ppt,.pptx"}
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      {contentType === ContentType.PDF ? (
                        <FileText className="h-4 w-4 text-blue" />
                      ) : (
                        <Presentation className="h-4 w-4 text-orange" />
                      )}
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Content Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseTitle">Course/Topic Title *</Label>
              <Input 
                id="courseTitle" 
                placeholder="e.g., Introduction to Data Structures" 
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseDescription">Course/Topic Description *</Label>
              <Textarea 
                id="courseDescription" 
                placeholder="Describe what this course/topic covers"
                rows={2}
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Content Title *</Label>
              <Input 
                id="title" 
                placeholder={`Enter ${contentType} title`} 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Content Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of this specific content"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Statistics">Statistics</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input 
                id="tags" 
                placeholder="Enter tags separated by commas" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <Button 
              className="w-full bg-blue hover:bg-blue/90" 
              disabled={
                !title || !description || !courseTitle || !courseDescription || !category || uploading ||
                (contentType === ContentType.VIDEO && !videoURL) ||
                ((contentType === ContentType.PDF || contentType === ContentType.POWERPOINT) && files.length === 0)
              }
              onClick={handleUpload}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {contentType === ContentType.VIDEO ? 'Video Link' : 
                    files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Content'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
