import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { Proposal } from '../src/domain'
import { genesisOneRipples } from '../src/genesisOneData'

const projectId = 'bible-ripple'
const email = 'codex-test@bible-ripple.local'
const password = 'local-test-only'

process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'

const app = initializeApp({ projectId })
const auth = getAuth(app)
const db = getFirestore(app)

const acceptedProposal: Proposal = {
  id: 'local-accepted-proposal',
  title: 'בראשית א:א וישעיהו מה:יב',
  proposer: 'עורך בדיקות',
  passageIds: ['gen-1-1', 'isa-45-12'],
  proposedType: 'מקבילה תוכנית',
  reasoning: 'שני המקורות מייחסים לאלוהים את בריאת השמים והארץ.',
  status: 'accepted',
  createdAt: '2026-08-20T10:00:00.000Z',
  comments: [],
  decision: {
    outcome: 'accepted',
    editor: 'עורך בדיקות',
    reasoning: 'המקור בישעיהו מאשר ומרחיב את תיאור הבריאה.',
    decidedAt: '2026-08-21T10:00:00.000Z',
  },
}

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
batch.set(db.doc(`proposals/${acceptedProposal.id}`), acceptedProposal)
await batch.commit()

console.log(`Seeded local editor, ${genesisOneRipples.length} Genesis 1 ripples and one accepted proposal.`)
