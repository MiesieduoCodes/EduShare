import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  increment,
  Timestamp,
  getDoc,
  setDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

// Content types enum
export enum ContentType {
  PDF = 'pdf',
  VIDEO = 'video',
  POWERPOINT = 'powerpoint'
}

// Visibility levels
export enum VisibilityLevel {
  PUBLIC = 'public',        // Students and lecturers can see
  LECTURER_ONLY = 'lecturer_only'  // Only lecturers can see
}

// Enhanced content document interface
export interface ContentDocument {
  id?: string
  title: string
  description: string
  courseTitle: string       // New: Course/topic title
  courseDescription: string // New: Course/topic description
  category: string
  tags: string[]
  contentType: ContentType  // New: Type of content
  visibility: VisibilityLevel // New: Who can see this content
  
  // File-specific fields (for PDFs and PowerPoints)
  fileName?: string
  fileSize?: number
  downloadURL?: string
  
  // Video-specific fields
  videoURL?: string         // New: For video links
  videoDuration?: number    // New: Video duration in seconds
  videoThumbnail?: string   // New: Video thumbnail URL
  
  // Common fields
  uploadDate: Timestamp
  downloads: number
  views: number             // New: View count
  uploadedBy: string
}

// Legacy interface for backward compatibility
export interface PDFDocument extends ContentDocument {
  contentType: ContentType.PDF
  fileName: string
  fileSize: number
  downloadURL: string
}

export interface LecturerProfile {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  office: string
  department: string
  title: string
  bio: string
  officeHours: { [key: string]: string }
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Student information interface
export interface StudentInfo {
  id?: string
  firstName: string
  lastName: string
  email: string
  matricNumber: string
  department: string
  level: string
  phoneNumber?: string
  createdAt: Timestamp
}

// Download record interface
export interface DownloadRecord {
  id?: string
  contentId: string
  contentTitle: string
  contentType: ContentType
  studentInfo: StudentInfo
  downloadDate: Timestamp
  ipAddress?: string
}

// Enhanced error handling wrapper
async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message)
      
      // Don't retry on certain errors
      if (error.code === 'permission-denied' || error.code === 'not-found') {
        throw error
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

// Enhanced content upload functions
export async function uploadContent(
  file: File | null, 
  metadata: Omit<ContentDocument, 'id' | 'downloadURL' | 'uploadDate' | 'downloads' | 'views' | 'fileSize' | 'fileName'>
) {
  return withRetry(async () => {
    try {
      let downloadURL = ''
      let fileName = ''
      let fileSize = 0

      // Handle file uploads (PDF and PowerPoint)
      if (file && (metadata.contentType === ContentType.PDF || metadata.contentType === ContentType.POWERPOINT)) {
        const folderName = metadata.contentType === ContentType.PDF ? 'pdfs' : 'powerpoints'
        const storageRef = ref(storage, `${folderName}/${Date.now()}_${file.name}`)
        const snapshot = await uploadBytes(storageRef, file)
        downloadURL = await getDownloadURL(snapshot.ref)
        fileName = file.name
        fileSize = file.size
      }

      // Add document to Firestore
      const docData: Omit<ContentDocument, 'id'> = {
        ...metadata,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        downloadURL: downloadURL || undefined,
        uploadDate: Timestamp.now(),
        downloads: 0,
        views: 0
      }

      const docRef = await addDoc(collection(db, 'content'), docData)
      return docRef.id
    } catch (error: any) {
      console.error('Error uploading content:', error)
      throw new Error(`Failed to upload content: ${error.message}`)
    }
  })
}

// Legacy PDF upload function for backward compatibility
export async function uploadPDF(file: File, metadata: Omit<PDFDocument, 'id' | 'downloadURL' | 'uploadDate' | 'downloads' | 'fileSize'>) {
  return uploadContent(file, {
    ...metadata,
    contentType: ContentType.PDF,
    courseTitle: metadata.category, // Use category as course title for legacy
    courseDescription: metadata.description,
    visibility: VisibilityLevel.PUBLIC
  })
}

// Get all content with visibility filtering
export async function getContent(isLecturer: boolean = false): Promise<ContentDocument[]> {
  return withRetry(async () => {
    try {
      let q
      if (isLecturer) {
        // Lecturers can see all content
        q = query(collection(db, 'content'), orderBy('uploadDate', 'desc'))
      } else {
        // Students can only see public content
        q = query(
          collection(db, 'content'), 
          where('visibility', '==', VisibilityLevel.PUBLIC),
          orderBy('uploadDate', 'desc')
        )
      }
      
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentDocument[]
    } catch (error: any) {
      console.error('Error getting content:', error)
      // Return empty array if offline or connection issues
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.warn('Operating in offline mode, returning cached data')
        return []
      }
      throw new Error(`Failed to load content: ${error.message}`)
    }
  })
}

// Legacy function for backward compatibility
export async function getPDFs(): Promise<PDFDocument[]> {
  const content = await getContent()
  return content.filter(item => item.contentType === ContentType.PDF) as PDFDocument[]
}

// Get content by type
export async function getContentByType(contentType: ContentType, isLecturer: boolean = false): Promise<ContentDocument[]> {
  const allContent = await getContent(isLecturer)
  return allContent.filter(item => item.contentType === contentType)
}

// Increment download count for content
export async function incrementDownloadCount(contentId: string) {
  return withRetry(async () => {
    try {
      const contentRef = doc(db, 'content', contentId)
      await updateDoc(contentRef, {
        downloads: increment(1)
      })
    } catch (error: any) {
      console.error('Error incrementing download count:', error)
      // Don't throw error for download count - it's not critical
      console.warn('Download count update failed, continuing with download')
    }
  }, 1) // Only retry once for download counts
}

// Increment view count for content
export async function incrementViewCount(contentId: string) {
  return withRetry(async () => {
    try {
      const contentRef = doc(db, 'content', contentId)
      await updateDoc(contentRef, {
        views: increment(1)
      })
    } catch (error: any) {
      console.error('Error incrementing view count:', error)
      // Don't throw error for view count - it's not critical
      console.warn('View count update failed, continuing')
    }
  }, 1) // Only retry once for view counts
}

// Delete content (works for all content types)
export async function deleteContent(contentId: string, downloadURL?: string) {
  return withRetry(async () => {
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, 'content', contentId))
      
      // Then delete from Storage if it has a file
      if (downloadURL) {
        const storageRef = ref(storage, downloadURL)
        await deleteObject(storageRef)
      }
    } catch (error: any) {
      console.error('Error deleting content:', error)
      throw new Error(`Failed to delete content: ${error.message}`)
    }
  })
}

// Legacy function for backward compatibility
export async function deletePDF(pdfId: string, downloadURL: string) {
  return deleteContent(pdfId, downloadURL)
}

// Lecturer Profile functions with error handling
export async function getLecturerProfile(lecturerId: string): Promise<LecturerProfile | null> {
  return withRetry(async () => {
    try {
      const lecturerDoc = await getDoc(doc(db, 'lecturers', lecturerId))
      if (lecturerDoc.exists()) {
        return { id: lecturerDoc.id, ...lecturerDoc.data() } as LecturerProfile
      }
      return null
    } catch (error: any) {
      console.error('Error getting lecturer profile:', error)
      if (error.code === 'unavailable') {
        return null
      }
      throw new Error(`Failed to load lecturer profile: ${error.message}`)
    }
  })
}

export async function updateLecturerProfile(lecturerId: string, profileData: Partial<LecturerProfile>) {
  return withRetry(async () => {
    try {
      const lecturerRef = doc(db, 'lecturers', lecturerId)
      await updateDoc(lecturerRef, {
        ...profileData,
        updatedAt: Timestamp.now()
      })
    } catch (error: any) {
      console.error('Error updating lecturer profile:', error)
      throw new Error(`Failed to update profile: ${error.message}`)
    }
  })
}

export async function createLecturerProfile(lecturerId: string, profileData: Omit<LecturerProfile, 'id' | 'createdAt' | 'updatedAt'>) {
  return withRetry(async () => {
    try {
      const lecturerRef = doc(db, 'lecturers', lecturerId)
      await setDoc(lecturerRef, {
        ...profileData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    } catch (error: any) {
      console.error('Error creating lecturer profile:', error)
      throw new Error(`Failed to create profile: ${error.message}`)
    }
  })
}

// Get the main lecturer for contact page (assumes single lecturer)
// Get content statistics for dashboard
// Student and download tracking functions
export async function recordStudentDownload(
  contentId: string,
  contentTitle: string,
  contentType: ContentType,
  studentInfo: Omit<StudentInfo, 'id' | 'createdAt'>
): Promise<string> {
  return withRetry(async () => {
    try {
      // First, save or update student info
      const studentRef = doc(db, 'students', studentInfo.email)
      const studentDoc = await getDoc(studentRef)
      
      if (!studentDoc.exists()) {
        // Create new student record
        await setDoc(studentRef, {
          ...studentInfo,
          createdAt: Timestamp.now()
        })
      }
      
      // Record the download
      const downloadRecord: Omit<DownloadRecord, 'id'> = {
        contentId,
        contentTitle,
        contentType,
        studentInfo: {
          ...studentInfo,
          id: studentInfo.email,
          createdAt: Timestamp.now()
        },
        downloadDate: Timestamp.now()
      }
      
      const downloadRef = await addDoc(collection(db, 'downloads'), downloadRecord)
      
      // Increment download count for the content
      await incrementDownloadCount(contentId)
      
      return downloadRef.id
    } catch (error: any) {
      console.error('Error recording student download:', error)
      throw new Error(`Failed to record download: ${error.message}`)
    }
  })
}

// Get download records for admin dashboard
export async function getDownloadRecords(limit: number = 50): Promise<DownloadRecord[]> {
  return withRetry(async () => {
    try {
      const q = query(
        collection(db, 'downloads'), 
        orderBy('downloadDate', 'desc'),
        ...(limit > 0 ? [getDocs] : [])
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DownloadRecord[]
    } catch (error: any) {
      console.error('Error getting download records:', error)
      throw new Error(`Failed to load download records: ${error.message}`)
    }
  })
}

// Get student information by email
export async function getStudentInfo(email: string): Promise<StudentInfo | null> {
  return withRetry(async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', email))
      if (studentDoc.exists()) {
        return { id: studentDoc.id, ...studentDoc.data() } as StudentInfo
      }
      return null
    } catch (error: any) {
      console.error('Error getting student info:', error)
      return null
    }
  })
}

export async function getContentStatistics(): Promise<{
  totalContent: number
  totalDownloads: number
  totalViews: number
  totalStudents: number
  contentByType: { [key in ContentType]: number }
  publicContent: number
  privateContent: number
}> {
  return withRetry(async () => {
    try {
      const [contentSnapshot, studentsSnapshot] = await Promise.all([
        getDocs(collection(db, 'content')),
        getDocs(collection(db, 'students'))
      ])
      
      const content = contentSnapshot.docs.map(doc => doc.data()) as ContentDocument[]
      
      const stats = {
        totalContent: content.length,
        totalDownloads: content.reduce((sum, item) => sum + item.downloads, 0),
        totalViews: content.reduce((sum, item) => sum + item.views, 0),
        totalStudents: studentsSnapshot.size,
        contentByType: {
          [ContentType.PDF]: content.filter(item => item.contentType === ContentType.PDF).length,
          [ContentType.VIDEO]: content.filter(item => item.contentType === ContentType.VIDEO).length,
          [ContentType.POWERPOINT]: content.filter(item => item.contentType === ContentType.POWERPOINT).length
        },
        publicContent: content.filter(item => item.visibility === VisibilityLevel.PUBLIC).length,
        privateContent: content.filter(item => item.visibility === VisibilityLevel.LECTURER_ONLY).length
      }
      
      return stats
    } catch (error: any) {
      console.error('Error getting content statistics:', error)
      throw new Error(`Failed to load statistics: ${error.message}`)
    }
  })
}

export async function getMainLecturer(): Promise<LecturerProfile | null> {
  return withRetry(async () => {
    try {
      const q = query(collection(db, 'lecturers'), orderBy('createdAt', 'asc'))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const lecturerDoc = querySnapshot.docs[0]
        return { id: lecturerDoc.id, ...lecturerDoc.data() } as LecturerProfile
      }
      return null
    } catch (error: any) {
      console.error('Error getting main lecturer:', error)
      if (error.code === 'unavailable') {
        return null
      }
      throw new Error(`Failed to load lecturer information: ${error.message}`)
    }
  })
}

// Real-time listener for content with visibility filtering
export function subscribeToContent(callback: (content: ContentDocument[]) => void, isLecturer: boolean = false) {
  let q
  if (isLecturer) {
    // Lecturers can see all content
    q = query(collection(db, 'content'), orderBy('uploadDate', 'desc'))
  } else {
    // Students can only see public content
    q = query(
      collection(db, 'content'), 
      where('visibility', '==', VisibilityLevel.PUBLIC),
      orderBy('uploadDate', 'desc')
    )
  }
  
  return onSnapshot(q, 
    (snapshot: QuerySnapshot<DocumentData>) => {
      const content = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentDocument[]
      callback(content)
    },
    (error) => {
      console.error('Error in content subscription:', error)
      // Call callback with empty array on error
      callback([])
    }
  )
}

// Legacy function for backward compatibility
export function subscribeToPDFs(callback: (pdfs: PDFDocument[]) => void) {
  return subscribeToContent((content) => {
    const pdfs = content.filter(item => item.contentType === ContentType.PDF) as PDFDocument[]
    callback(pdfs)
  })
}
