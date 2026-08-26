import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAGIa7Qzmx-09xUP-iHG2CDsRfWi_TpsDI',
  // Keep redirect authentication on the same origin so mobile browsers that
  // partition third-party storage can restore the Firebase session.
  authDomain: 'bible-ripple.web.app',
  projectId: 'bible-ripple',
  storageBucket: 'bible-ripple.firebasestorage.app',
  messagingSenderId: '483598197989',
  appId: '1:483598197989:web:a99febb41f6d66a29ee00c',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const usingFirebaseEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

if (usingFirebaseEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
