"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Phone, MapPin, Camera, Save, Loader2, CheckCircle } from 'lucide-react'
import { getLecturerProfile, updateLecturerProfile, createLecturerProfile, LecturerProfile } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'

export function ProfileSection() {
  const [profile, setProfile] = useState<LecturerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      let lecturerProfile = await getLecturerProfile(user.uid)
      
      if (!lecturerProfile) {
        // Create default profile
        const defaultProfile: Omit<LecturerProfile, 'id' | 'createdAt' | 'updatedAt'> = {
          firstName: '',
          lastName: '',
          email: user.email || '',
          phone: '',
          office: '',
          department: '',
          title: '',
          bio: '',
          officeHours: {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: ''
          }
        }
        
        await createLecturerProfile(user.uid, defaultProfile)
        lecturerProfile = await getLecturerProfile(user.uid)
      }
      
      setProfile(lecturerProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !profile) return
    
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      await updateLecturerProfile(user.uid, profile)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = (field: keyof LecturerProfile, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  const updateOfficeHours = (day: string, hours: string) => {
    setProfile(prev => prev ? {
      ...prev,
      officeHours: { ...prev.officeHours, [day]: hours }
    } : null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Profile <span className="text-orange">Settings</span>
        </h1>
        <p className="text-muted-foreground">
          Manage your profile information and preferences
        </p>
      </div>

      {saveSuccess && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="w-32 h-32">
                <AvatarImage src="/placeholder.svg?height=128&width=128" />
                <AvatarFallback className="text-2xl">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Button variant="outline" className="w-full">
                Change Picture
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={profile.firstName}
                  onChange={(e) => updateProfile('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={profile.lastName}
                  onChange={(e) => updateProfile('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={profile.title}
                onChange={(e) => updateProfile('title', e.target.value)}
                placeholder="e.g., Professor of Computer Science"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                rows={3}
                value={profile.bio}
                onChange={(e) => updateProfile('bio', e.target.value)}
                placeholder="Brief description about yourself and your expertise"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="office">Office Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="office" 
                      value={profile.office}
                      onChange={(e) => updateProfile('office', e.target.value)}
                      className="pl-10"
                      placeholder="Building, Room Number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value={profile.department}
                    onChange={(e) => updateProfile('department', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Office Hours */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Office Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday'].map(day => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium capitalize">{day}</span>
                    <Input 
                      className="w-48" 
                      value={profile.officeHours[day] || ''}
                      onChange={(e) => updateOfficeHours(day, e.target.value)}
                      placeholder="e.g., 2:00 PM - 4:00 PM"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {['thursday', 'friday', 'saturday'].map(day => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium capitalize">{day}</span>
                    <Input 
                      className="w-48" 
                      value={profile.officeHours[day] || ''}
                      onChange={(e) => updateOfficeHours(day, e.target.value)}
                      placeholder="e.g., 10:00 AM - 12:00 PM"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={loadProfile}>
                Cancel
              </Button>
              <Button 
                className="bg-blue hover:bg-blue/90"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
