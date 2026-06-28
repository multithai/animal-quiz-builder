import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB1QQ-pbfbIFl-9IvgLCdDyB4diiCK5r1U',
  authDomain: 'animal-quiz-builder-mt.firebaseapp.com',
  projectId: 'animal-quiz-builder-mt',
  storageBucket: 'animal-quiz-builder-mt.firebasestorage.app',
  messagingSenderId: '16849141311',
  appId: '1:16849141311:web:ab6537aba7d7173e62c28a',
}

export const ADMIN_EMAIL = 'multithai.info@gmail.com'

export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)
export const auth = getAuth(firebaseApp)

void setPersistence(auth, browserLocalPersistence).catch(() => undefined)
