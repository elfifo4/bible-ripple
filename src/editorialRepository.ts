import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import type { EditorialRule, Proposal, Ripple } from './domain'
import { db } from './firebaseClient'

export type EditorialContent = {
  ripples: Ripple[]
  proposals: Proposal[]
  editorialRules: EditorialRule[]
}

const readCollection = async <T>(name: string): Promise<T[]> => {
  const snapshot = await getDocs(collection(db, name))
  return snapshot.docs.map((item) => item.data() as T)
}

export async function isEditorAllowed(email: string): Promise<boolean> {
  const access = await getDoc(doc(db, 'editorAccess', email.toLowerCase()))
  return access.exists()
}

export async function loadEditorialContent(): Promise<EditorialContent> {
  const [ripples, proposals, editorialRules] = await Promise.all([
    readCollection<Ripple>('ripples'),
    readCollection<Proposal>('proposals'),
    readCollection<EditorialRule>('editorialRules'),
  ])
  return { ripples, proposals, editorialRules }
}

export async function saveProposal(proposal: Proposal): Promise<void> {
  await setDoc(doc(db, 'proposals', proposal.id), proposal)
}
