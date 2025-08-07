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

export interface PDFDocument {
  id?: string
  title: string
  description: string
  category: string
  tags: string[]
  fileName: string
  fileSize: number
  downloadURL: string
  uploadDate: Timestamp
  downloads: number
  uploadedBy: string
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

// PDF Document functions with error handling
export async function uploadPDF(file: File, metadata: Omit<PDFDocument, 'id' | 'downloadURL' | 'uploadDate' | 'downloads' | 'fileSize'>) {
  return withRetry(async () => {
    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `pdfs/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Add document to Firestore
      const docData: Omit<PDFDocument, 'id'> = {
        ...metadata,
        fileName: file.name,
        fileSize: file.size,
        downloadURL,
        uploadDate: Timestamp.now(),
        downloads: 0
      }

      const docRef = await addDoc(collection(db, 'pdfs'), docData)
      return docRef.id
    } catch (error: any) {
      console.error('Error uploading PDF:', error)
      throw new Error(`Failed to upload PDF: ${error.message}`)
    }
  })
}

export async function getPDFs(): Promise<PDFDocument[]> {
  return withRetry(async () => {
    try {
      const q = query(collection(db, 'pdfs'), orderBy('uploadDate', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PDFDocument[]
    } catch (error: any) {
      console.error('Error getting PDFs:', error)
      // Return empty array if offline or connection issues
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.warn('Operating in offline mode, returning cached data')
        return []
      }
      throw new Error(`Failed to load PDFs: ${error.message}`)
    }
  })
}

export async function incrementDownloadCount(pdfId: string) {
  return withRetry(async () => {
    try {
      const pdfRef = doc(db, 'pdfs', pdfId)
      await updateDoc(pdfRef, {
        downloads: increment(1)
      })
    } catch (error: any) {
      console.error('Error incrementing download count:', error)
      // Don't throw error for download count - it's not critical
      console.warn('Download count update failed, continuing with download')
    }
  }, 1) // Only retry once for download counts
}

export async function deletePDF(pdfId: string, downloadURL: string) {
  return withRetry(async () => {
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, 'pdfs', pdfId))
      
      // Then delete from Storage
      const storageRef = ref(storage, downloadURL)
      await deleteObject(storageRef)
    } catch (error: any) {
      console.error('Error deleting PDF:', error)
      throw new Error(`Failed to delete PDF: ${error.message}`)
    }
  })
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

// Real-time listener for PDFs (optional, for live updates)
export function subscribeToPDFs(callback: (pdfs: PDFDocument[]) => void) {
  const q = query(collection(db, 'pdfs'), orderBy('uploadDate', 'desc'))
  
  return onSnapshot(q, 
    (snapshot: QuerySnapshot<DocumentData>) => {
      const pdfs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PDFDocument[]
      callback(pdfs)
    },
    (error) => {
      console.error('Error in PDF subscription:', error)
      // Call callback with empty array on error
      callback([])
    }
  )
}
