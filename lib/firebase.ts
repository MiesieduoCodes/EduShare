import { initializeApp } from 'firebase/app'
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCJi1iWCdBsFkNdDawm9xWqUtC4esYiJi4",
  authDomain: "edushare-1df32.firebaseapp.com",
  projectId: "edushare-1df32",
  storageBucket: "edushare-1df32.firebasestorage.app",
  messagingSenderId: "196825803645",
  appId: "1:196825803645:web:b409fa0398d3bf0df23a14",
  measurementId: "G-EKKVX28E74"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services (removed auth)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Enable offline persistence and configure settings
if (typeof window !== 'undefined') {
  // Only run on client side
  import('firebase/firestore').then(({ enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED }) => {
    enableIndexedDbPersistence(db, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence')
      }
    })
  })
}

// Connection management utilities
export const enableFirestoreNetwork = () => enableNetwork(db)
export const disableFirestoreNetwork = () => disableNetwork(db)

export default app
