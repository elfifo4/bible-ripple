import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { applicationDefault, getApps, initializeApp, type Credential } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

type Selection = { kind: 'range'; startVerse: number; endVerse?: number } | { kind: 'verses'; verses: number[] }
type StagingPassage = { canonicalRef: string; bookTitleHe: string; chapter: number; selection: Selection }
type Candidate = { id: string; approvalSignal: string; anchor: StagingPassage & { book: string }; sources: Array<StagingPassage & { canonicalRef: string | null; parseError: string | null }> }
type Staging = { candidates: Candidate[] }

const args = process.argv.slice(2)
const valueAfter = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined }
const stagingPath = valueAfter('--staging')
const outputPath = valueAfter('--output')
const backupDir = valueAfter('--backup-dir')
const projectId = valueAfter('--project') ?? 'bible-ripple'
const apply = args.includes('--apply')
const useGcloudAuth = args.includes('--gcloud-auth')
const exclusions = args.flatMap((arg, index) => arg === '--exclude-source' ? [args[index + 1]] : []).filter(Boolean)
const excludedCandidates = new Set(args.flatMap((arg, index) => arg === '--exclude-candidate' ? [args[index + 1]] : []).filter(Boolean))
if (!stagingPath || !outputPath) throw new Error('Usage: tsx scripts/import-genesis-staging.ts --staging FILE --output FILE [--exclude-source "ANCHOR=SOURCE"] [--project ID --backup-dir DIR --apply]')
if (apply && !backupDir) throw new Error('--backup-dir is required with --apply')

const excluded = new Set(exclusions)
const staging = JSON.parse(readFileSync(stagingPath, 'utf8')) as Staging
const candidates = staging.candidates.filter((candidate) => !excludedCandidates.has(candidate.id))
const bookOrder: Record<string, number> = {
  Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5, Joshua: 6, Judges: 7,
  'I Samuel': 8, 'II Samuel': 9, 'I Kings': 10, 'II Kings': 11, Isaiah: 12, Jeremiah: 13,
  Ezekiel: 14, Hosea: 15, Joel: 16, Amos: 17, Obadiah: 18, Jonah: 19, Micah: 20, Nahum: 21,
  Habakkuk: 22, Zephaniah: 23, Haggai: 24, Zechariah: 25, Malachi: 26, Psalms: 27,
  Proverbs: 28, Job: 29, 'Song of Songs': 30, Ruth: 31, Lamentations: 32, Ecclesiastes: 33,
  Esther: 34, Daniel: 35, Ezra: 36, Nehemiah: 37, 'I Chronicles': 38, 'II Chronicles': 39,
}
const genesisVerseCounts = [
  0, 31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38,
  18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23,
  23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26,
]
const idOf = (canonicalRef: string) => `ref-${canonicalRef.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
const passageMap = new Map<string, Record<string, unknown>>()
const register = (item: StagingPassage & { book?: string }) => {
  const book = item.book ?? item.canonicalRef.match(/^(.+) \d+:/)?.[1]
  if (!book || !bookOrder[book]) throw new Error(`Unknown book in ${item.canonicalRef}`)
  const id = idOf(item.canonicalRef)
  passageMap.set(id, { id, canonicalRef: item.canonicalRef, book, bookTitleHe: item.bookTitleHe, bookOrder: bookOrder[book], chapter: item.chapter, selection: item.selection })
  return id
}
const importedChapters = [...new Set(candidates.map((candidate) => candidate.anchor.chapter))]
for (const chapter of importedChapters) {
  const count = genesisVerseCounts[chapter]
  if (!count) throw new Error(`Missing Genesis verse count for chapter ${chapter}`)
  for (let verse = 1; verse <= count; verse += 1) register({ canonicalRef: `Genesis ${chapter}:${verse}`, book: 'Genesis', bookTitleHe: 'בראשית', chapter, selection: { kind: 'range', startVerse: verse } })
}
const ripples = candidates.filter((candidate) => candidate.approvalSignal === 'yellow-anchor').map((candidate) => {
  const anchorPassageId = register(candidate.anchor)
  const sources = candidate.sources.filter((source) => source.canonicalRef && !source.parseError && !excluded.has(`${candidate.anchor.canonicalRef}=${source.canonicalRef}`))
  return {
    id: candidate.id.replace('staging-', 'docx-'), type: 'מקבילה תוכנית', anchorPassageId, status: 'approved',
    members: [{ passageId: anchorPassageId, role: 'עוגן' }, ...sources.map((source) => ({ passageId: register(source as StagingPassage), role: 'מקבילה' }))],
  }
})
const payload = { schemaVersion: 1, generatedAt: new Date().toISOString(), passages: [...passageMap.values()], ripples }
writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8')
console.log(`Prepared ${ripples.length} ripples and ${passageMap.size} passages in ${outputPath}`)

if (apply) {
  const credential: Credential = useGcloudAuth ? {
    getAccessToken: async () => ({
      access_token: execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim(),
      expires_in: 3300,
    }),
  } : applicationDefault()
  const app = getApps()[0] ?? initializeApp({ credential, projectId })
  const db = getFirestore(app)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = join(backupDir!, `production-backup-${timestamp}`)
  mkdirSync(target, { recursive: true })
  for (const collectionName of ['passages', 'ripples']) {
    const snapshot = await db.collection(collectionName).get()
    writeFileSync(join(target, `${collectionName}.json`), JSON.stringify(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })), null, 2), 'utf8')
  }
  const writes = [
    ...payload.passages.map((passage) => ({ path: `passages/${passage.id}`, data: passage })),
    ...payload.ripples.map((ripple) => ({ path: `ripples/${ripple.id}`, data: ripple })),
  ]
  for (let offset = 0; offset < writes.length; offset += 450) {
    const batch = db.batch()
    for (const write of writes.slice(offset, offset + 450)) batch.set(db.doc(write.path), write.data)
    await batch.commit()
  }
  console.log(`Backed up existing collections to ${target}`)
  console.log(`Imported ${payload.ripples.length} ripples from ${basename(stagingPath)} into ${projectId}`)
}
