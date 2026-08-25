import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'bible-ripple-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') },
})

try {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'editorAccess/editor@example.com'), { role: 'editor' })
    await setDoc(doc(context.firestore(), 'ripples/example'), { title: 'protected content' })
  })

  const editor = testEnv.authenticatedContext('editor-user', { email: 'editor@example.com', email_verified: true }).firestore()
  const outsider = testEnv.authenticatedContext('outsider-user', { email: 'outsider@example.com', email_verified: true }).firestore()
  const unverified = testEnv.authenticatedContext('unverified-user', { email: 'editor@example.com', email_verified: false }).firestore()
  const anonymous = testEnv.unauthenticatedContext().firestore()

  await assertSucceeds(getDoc(doc(editor, 'ripples/example')))
  await assertSucceeds(setDoc(doc(editor, 'proposals/example'), { status: 'open' }))
  await assertFails(getDoc(doc(outsider, 'ripples/example')))
  await assertFails(getDoc(doc(unverified, 'ripples/example')))
  await assertFails(getDoc(doc(anonymous, 'ripples/example')))
  await assertFails(setDoc(doc(editor, 'editorAccess/another@example.com'), { role: 'editor' }))

  console.log('Firestore rules: 6 checks passed.')
} finally {
  await testEnv.cleanup()
}
