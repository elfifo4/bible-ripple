import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { genesisOneRipples } from '../src/genesisOneData'

const projectId = 'bible-ripple'
const email = 'codex-test@bible-ripple.local'
const password = 'local-test-only'

process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'

const app = initializeApp({ projectId })
const auth = getAuth(app)
const db = getFirestore(app)

try {
  await auth.getUserByEmail(email)
} catch {
  await auth.createUser({
    uid: 'codex-test-editor',
    email,
    emailVerified: true,
    password,
    displayName: 'עורך בדיקות',
  })
}

const batch = db.batch()
batch.set(db.doc(`editorAccess/${email}`), { role: 'editor', localOnly: true })
for (const ripple of genesisOneRipples) batch.set(db.doc(`ripples/${ripple.id}`), ripple)
await batch.commit()

console.log(`Seeded local editor and ${genesisOneRipples.length} Genesis 1 ripples.`)
