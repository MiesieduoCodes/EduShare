"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Clock, User, Loader2 } from 'lucide-react'
import { getMainLecturer, LecturerProfile } from '@/lib/firestore'

export default function ContactPage() {
  const [lecturerProfile, setLecturerProfile] = useState<LecturerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLecturerProfile()
  }, [])

  const loadLecturerProfile = async () => {
    try {
      const lecturer = await getMainLecturer()
      setLecturerProfile(lecturer)
    } catch (error) {
      console.error('Error loading lecturer profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailClick = () => {
    if (lecturerProfile?.email) {
      window.location.href = `mailto:${lecturerProfile.email}`
    }
  }

  const handlePhoneClick = () => {
    if (lecturerProfile?.phone) {
      window.location.href = `tel:${lecturerProfile.phone}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading contact information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lecturerProfile) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Contact Information</h1>
          <p className="text-muted-foreground">No lecturer profile found. Please check back later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">
            Contact & <span className="text-orange">Lecturer Info</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get in touch with your instructor or find important contact information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lecturer Profile */}
          <Card className="h-fit">
            <CardHeader className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue to-orange rounded-full flex items-center justify-center">
                <User className="h-16 w-16 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {lecturerProfile.firstName} {lecturerProfile.lastName}
              </CardTitle>
              <p className="text-muted-foreground">{lecturerProfile.title}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {lecturerProfile.bio && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {lecturerProfile.bio}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{lecturerProfile.email}</p>
                  </div>
                </div>

                {lecturerProfile.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-orange" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{lecturerProfile.phone}</p>
                    </div>
                  </div>
                )}

                {lecturerProfile.office && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue" />
                    </div>
                    <div>
                      <p className="font-medium">Office</p>
                      <p className="text-sm text-muted-foreground">{lecturerProfile.office}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full bg-blue hover:bg-blue/90" onClick={handleEmailClick}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                {lecturerProfile.phone && (
                  <Button variant="outline" className="w-full" onClick={handlePhoneClick}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Contact & Info */}
          <div className="space-y-6">
            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange" />
                  Office Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(lecturerProfile.officeHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium capitalize">{day}</span>
                      <span className="text-muted-foreground">
                        {hours || 'Not available'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Information */}
            {lecturerProfile.department && (
              <Card>
                <CardHeader>
                  <CardTitle>Department Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue/5 rounded-lg border border-blue/20">
                    <h4 className="font-medium text-blue">{lecturerProfile.department}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Department
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleEmailClick}>
                  <Mail className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
                {lecturerProfile.phone && (
                  <Button variant="outline" className="w-full justify-start" onClick={handlePhoneClick}>
                    <Phone className="h-4 w-4 mr-2" />
                    Request Phone Call
                  </Button>
                )}
                {lecturerProfile.office && (
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions to Office
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
