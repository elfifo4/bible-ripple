import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

type Candidate = { id: string; approvalSignal: string; trace: { excerpts: string[] } }
type Staging = { candidates: Candidate[] }

const args = process.argv.slice(2)
const valuesAfter = (flag: string) => args.flatMap((arg, index) => arg === flag ? [args[index + 1]] : []).filter(Boolean)
const stagingPaths = valuesAfter('--staging')
const outputPath = args[args.indexOf('--output') + 1]
const backupDir = args[args.indexOf('--backup-dir') + 1]
const projectId = args.includes('--project') ? args[args.indexOf('--project') + 1] : 'bible-ripple'
const apply = args.includes('--apply')
if (!stagingPaths.length || !outputPath) throw new Error('Usage: tsx scripts/suggest-ripple-titles.ts --staging FILE [--staging FILE] --output FILE [--project ID --backup-dir DIR --apply]')
if (apply && !backupDir) throw new Error('--backup-dir is required with --apply')

const titleFromAnchor = (text: string) => {
  const bookNames = /(?:בראשית|שמות|ויקרא|במדבר|דברים|יהושע|שופטים|שמואל|מלכים|ישעיהו|ירמיהו|יחזקאל|הושע|יואל|עמוס|עובדיה|יונה|מיכה|נחום|חבקוק|צפניה|חגי|זכריה|מלאכי|תהילים|תהלים|משלי|איוב|שיר השירים|רות|איכה|קהלת|אסתר|דניאל|עזרא|נחמיה|דברי הימים)/
  const withoutFollowingSource = (() => { const match = bookNames.exec(text); return match && match.index > 10 ? text.slice(0, match.index) : text })()
  const firstVerse = withoutFollowingSource.split(':')[0]
    .replace(/[\u0591-\u05c7]/g, '')
    .replace(/^\s*[()]?[א-ת]{1,3}[()]?\s+/, '')
    .replace(/\{[פס]\}/g, '')
    .replace(/[^א-ת'״׳\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return firstVerse.split(' ').slice(0, 7).join(' ')
}

const suggestions = stagingPaths.flatMap((path) => (JSON.parse(readFileSync(path, 'utf8')) as Staging).candidates)
  .filter((candidate) => candidate.approvalSignal === 'yellow-anchor')
  .map((candidate) => ({ id: candidate.id.replace('staging-', 'docx-'), suggestedTitle: titleFromAnchor(candidate.trace.excerpts[0] ?? '') }))
  .filter((item) => item.suggestedTitle)
const uniqueSuggestions = [...new Map(suggestions.map((item) => [item.id, item])).values()]
writeFileSync(outputPath, JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), suggestions: uniqueSuggestions }, null, 2), 'utf8')
console.log(`Prepared ${uniqueSuggestions.length} private title suggestions in ${outputPath}`)

if (apply) {
  const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId }))
  const snapshot = await db.collection('ripples').get()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = join(backupDir, `title-suggestions-backup-${timestamp}`)
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'ripples.json'), JSON.stringify(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })), null, 2), 'utf8')
  const current = new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]))
  const writes = uniqueSuggestions.filter((item) => current.has(item.id) && !current.get(item.id)?.title)
  for (let offset = 0; offset < writes.length; offset += 450) {
    const batch = db.batch()
    for (const write of writes.slice(offset, offset + 450)) batch.set(db.doc(`ripples/${write.id}`), { suggestedTitle: write.suggestedTitle }, { merge: true })
    await batch.commit()
  }
  console.log(`Backed up ripples to ${target}`)
  console.log(`Stored ${writes.length} suggestions without overwriting approved titles`)
}
