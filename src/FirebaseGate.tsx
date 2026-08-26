import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import App from './App'
import { addEditorAccess, getEditorAccess, loadEditorialContent, loadEditorAccessList, removeEditorAccess, type EditorialContent, type EditorAccess, saveProposal } from './editorialRepository'
import { auth, googleProvider, usingFirebaseEmulators } from './firebaseClient'

const LOCAL_TEST_EMAIL = 'codex-test@bible-ripple.local'
const LOCAL_TEST_PASSWORD = 'local-test-only'

type GateState =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'forbidden'; user: User }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; user: User; content: EditorialContent; access: EditorAccess; authorizedUsers: EditorAccess[] }

const displayName = (user: User) => user.displayName || user.email || 'עורך'

export default function FirebaseGate() {
  const [state, setState] = useState<GateState>({ kind: 'loading' })
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user?.email) {
      setState({ kind: 'signed-out' })
      return
    }
    setState({ kind: 'loading' })
    try {
      const access = user.emailVerified ? await getEditorAccess(user.email) : null
      if (!access) {
        setState({ kind: 'forbidden', user })
        return
      }
      const [content, authorizedUsers] = await Promise.all([
        loadEditorialContent(),
        access.role === 'admin' ? loadEditorAccessList() : Promise.resolve([]),
      ])
      setState({ kind: 'ready', user, content, access, authorizedUsers })
    } catch {
      setState({ kind: 'error', message: 'לא ניתן לטעון כעת את מרחב העריכה.' })
    }
  }), [])

  const signIn = async () => {
    setSigningIn(true)
    try {
      const mobile = window.matchMedia('(max-width: 700px)').matches
      if (mobile) await signInWithRedirect(auth, googleProvider)
      else await signInWithPopup(auth, googleProvider)
    } catch {
      setSigningIn(false)
      setState({ kind: 'error', message: 'הכניסה עם Google לא הושלמה.' })
    }
  }

  const signInLocally = async () => {
    setSigningIn(true)
    try {
      await signInWithEmailAndPassword(auth, LOCAL_TEST_EMAIL, LOCAL_TEST_PASSWORD)
    } catch {
      setSigningIn(false)
      setState({ kind: 'error', message: 'הכניסה המקומית נכשלה. ודאו שהאמולטורים נזרעו ופועלים.' })
    }
  }

  if (state.kind === 'loading') return <GateCard title="טוען את מרחב העריכה…" />
  if (state.kind === 'signed-out') return <GateCard title="אדוות התנ״ך" body="מרחב העריכה זמין לעורכים מורשים בלבד.">
    <button className="google-sign-in" disabled={signingIn} onClick={() => void signIn()}>{signingIn ? 'מתחבר…' : 'כניסה עם Google'}</button>
    {usingFirebaseEmulators && <button className="local-test-sign-in" disabled={signingIn} onClick={() => void signInLocally()}>כניסת בדיקה מקומית</button>}
  </GateCard>
  if (state.kind === 'forbidden') return <GateCard title="אין הרשאה" body={`החשבון ${state.user.email ?? ''} אינו מורשה להיכנס למרחב העריכה.`}><button onClick={() => void signOut(auth)}>יציאה ובחירת חשבון אחר</button></GateCard>
  if (state.kind === 'error') return <GateCard title="משהו השתבש" body={state.message}><button onClick={() => window.location.reload()}>ניסיון נוסף</button></GateCard>

  return <App
    currentUserName={displayName(state.user)}
    currentUserPhotoUrl={state.user.photoURL}
    ripplesData={state.content.ripples}
    initialProposals={state.content.proposals}
    editorialRulesData={state.content.editorialRules}
    currentUserRole={state.access.role}
    initialAuthorizedUsers={state.authorizedUsers}
    onAddAuthorizedUser={(email) => addEditorAccess(email, state.user.email!)}
    onRemoveAuthorizedUser={removeEditorAccess}
    onSaveProposal={saveProposal}
    onSignOut={() => void signOut(auth)}
  />
}

function GateCard({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return <main className="auth-shell"><section className="auth-card"><img src="/icon-256.png" alt="" /><h1>{title}</h1>{body && <p>{body}</p>}{children}</section></main>
}
