"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, User, Mail, Hash, GraduationCap, Building, Phone } from 'lucide-react'
import { recordStudentDownload, ContentDocument, ContentType } from '@/lib/firestore'

interface StudentDownloadFormProps {
  content: ContentDocument
  isOpen: boolean
  onClose: () => void
  onDownloadSuccess: () => void
}

export function StudentDownloadForm({ content, isOpen, onClose, onDownloadSuccess }: StudentDownloadFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricNumber: '',
    department: '',
    level: '',
    phoneNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const departments = [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Accounting',
    'Economics',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Mass Communication',
    'Law',
    'Medicine',
    'Nursing',
    'Pharmacy',
    'Other'
  ]

  const levels = [
    '100 Level',
    '200 Level', 
    '300 Level',
    '400 Level',
    '500 Level',
    '600 Level',
    'Postgraduate'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const validateForm = () => {
    const { firstName, lastName, email, matricNumber, department, level } = formData
    
    if (!firstName.trim()) return 'First name is required'
    if (!lastName.trim()) return 'Last name is required'
    if (!email.trim()) return 'Email is required'
    if (!email.includes('@')) return 'Please enter a valid email address'
    if (!matricNumber.trim()) return 'Matric number is required'
    if (!department) return 'Department is required'
    if (!level) return 'Level is required'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await recordStudentDownload(
        content.id!,
        content.title,
        content.contentType,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          matricNumber: formData.matricNumber.trim().toUpperCase(),
          department: formData.department,
          level: formData.level,
          phoneNumber: formData.phoneNumber.trim() || undefined
        }
      )

      // Start download
      if (content.downloadURL) {
        window.open(content.downloadURL, '_blank')
      }

      onDownloadSuccess()
      onClose()

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        matricNumber: '',
        department: '',
        level: '',
        phoneNumber: ''
      })
    } catch (error: any) {
      console.error('Download failed:', error)
      setError(error.message || 'Failed to process download. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue" />
            <span>Download Request</span>
          </DialogTitle>
          <DialogDescription>
            Please provide your information to download "{content.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>First Name *</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Last Name *</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>Email Address *</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john.doe@student.edu"
              required
            />
          </div>

          {/* Matric Number */}
          <div className="space-y-2">
            <Label htmlFor="matricNumber" className="flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span>Matric Number *</span>
            </Label>
            <Input
              id="matricNumber"
              value={formData.matricNumber}
              onChange={(e) => handleInputChange('matricNumber', e.target.value)}
              placeholder="e.g., CSC/2020/001"
              required
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <Building className="h-3 w-3" />
              <span>Department *</span>
            </Label>
            <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <GraduationCap className="h-3 w-3" />
              <span>Level *</span>
            </Label>
            <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>Phone Number (Optional)</span>
            </Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+234 xxx xxx xxxx"
            />
          </div>

          {error && (
            <Alert className="border-destructive/20 bg-destructive/10">
              <AlertDescription className="text-destructive text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue hover:bg-blue/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Your information will be used for download tracking and academic purposes only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
