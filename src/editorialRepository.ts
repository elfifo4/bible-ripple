import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import type { EditorialRule, PassageRef, Proposal, Ripple } from './domain'
import { db } from './firebaseClient'

export type EditorialContent = {
  passages: PassageRef[]
  ripples: Ripple[]
  proposals: Proposal[]
  editorialRules: EditorialRule[]
}

export type AccessRole = 'admin' | 'editor'

export type EditorAccess = {
  email: string
  role: AccessRole
  addedAt?: string
  addedBy?: string
}

export const compareEditorAccess = (a: EditorAccess, b: EditorAccess): number => {
  if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
  return a.email.localeCompare(b.email, 'en')
}

const readCollection = async <T>(name: string): Promise<T[]> => {
  const snapshot = await getDocs(collection(db, name))
  return snapshot.docs.map((item) => item.data() as T)
}

export async function getEditorAccess(email: string): Promise<EditorAccess | null> {
  const access = await getDoc(doc(db, 'editorAccess', email.toLowerCase()))
  if (!access.exists()) return null
  return { email: access.id, ...(access.data() as Omit<EditorAccess, 'email'>) }
}

export async function loadEditorAccessList(): Promise<EditorAccess[]> {
  const snapshot = await getDocs(collection(db, 'editorAccess'))
  return snapshot.docs.map((item) => ({ email: item.id, ...(item.data() as Omit<EditorAccess, 'email'>) })).sort(compareEditorAccess)
}

export async function addEditorAccess(email: string, addedBy: string): Promise<EditorAccess> {
  const normalizedEmail = email.trim().toLowerCase()
  const access: EditorAccess = { email: normalizedEmail, role: 'editor', addedAt: new Date().toISOString(), addedBy }
  await setDoc(doc(db, 'editorAccess', normalizedEmail), { role: access.role, addedAt: access.addedAt, addedBy: access.addedBy })
  return access
}

export async function removeEditorAccess(email: string): Promise<void> {
  await deleteDoc(doc(db, 'editorAccess', email.toLowerCase()))
}

export async function loadEditorialContent(): Promise<EditorialContent> {
  const [passages, ripples, proposals, editorialRules] = await Promise.all([
    readCollection<PassageRef>('passages'),
    readCollection<Ripple>('ripples'),
    readCollection<Proposal>('proposals'),
    readCollection<EditorialRule>('editorialRules'),
  ])
  return { passages, ripples, proposals, editorialRules }
}

export async function saveProposal(proposal: Proposal): Promise<void> {
  await setDoc(doc(db, 'proposals', proposal.id), proposal)
}
