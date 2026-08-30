import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'bible-ripple-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') },
})

try {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'editorAccess/editor@example.com'), { role: 'editor' })
    await setDoc(doc(context.firestore(), 'editorAccess/admin@example.com'), { role: 'admin' })
    await setDoc(doc(context.firestore(), 'ripples/example'), { title: 'protected content' })
    await setDoc(doc(context.firestore(), 'passages/example'), { canonicalRef: 'Genesis 1:1' })
  })

  const editor = testEnv.authenticatedContext('editor-user', { email: 'editor@example.com', email_verified: true }).firestore()
  const admin = testEnv.authenticatedContext('admin-user', { email: 'admin@example.com', email_verified: true }).firestore()
  const outsider = testEnv.authenticatedContext('outsider-user', { email: 'outsider@example.com', email_verified: true }).firestore()
  const unverified = testEnv.authenticatedContext('unverified-user', { email: 'editor@example.com', email_verified: false }).firestore()
  const anonymous = testEnv.unauthenticatedContext().firestore()

  await assertSucceeds(getDoc(doc(editor, 'ripples/example')))
  await assertSucceeds(getDoc(doc(editor, 'passages/example')))
  await assertFails(getDoc(doc(outsider, 'passages/example')))
  await assertSucceeds(setDoc(doc(editor, 'proposals/example'), { status: 'open' }))
  await assertFails(getDoc(doc(outsider, 'ripples/example')))
  await assertFails(getDoc(doc(unverified, 'ripples/example')))
  await assertFails(getDoc(doc(anonymous, 'ripples/example')))
  await assertFails(setDoc(doc(editor, 'editorAccess/another@example.com'), { role: 'editor' }))
  await assertSucceeds(getDocs(collection(admin, 'editorAccess')))
  await assertSucceeds(setDoc(doc(admin, 'editorAccess/another@example.com'), { role: 'editor', addedAt: 'now', addedBy: 'admin@example.com' }))
  await assertFails(setDoc(doc(admin, 'editorAccess/second-admin@example.com'), { role: 'admin' }))
  await assertFails(deleteDoc(doc(admin, 'editorAccess/admin@example.com')))
  await assertSucceeds(deleteDoc(doc(admin, 'editorAccess/another@example.com')))

  console.log('Firestore rules: 13 checks passed.')
} finally {
  await testEnv.cleanup()
}
