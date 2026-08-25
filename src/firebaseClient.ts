import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAGIa7Qzmx-09xUP-iHG2CDsRfWi_TpsDI',
  authDomain: 'bible-ripple.firebaseapp.com',
  projectId: 'bible-ripple',
  storageBucket: 'bible-ripple.firebasestorage.app',
  messagingSenderId: '483598197989',
  appId: '1:483598197989:web:a99febb41f6d66a29ee00c',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
