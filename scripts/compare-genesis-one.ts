import { readFileSync, writeFileSync } from 'node:fs'
import { genesisOnePassages, genesisOneRipples } from '../src/genesisOneData'

type Citation = { canonical_ref: string | null }
type CandidateGroup = { chapter: number; anchorVerses: number[]; citations: Citation[] }
type Inventory = { paragraphs: Array<{ chapter: number | null; text: string; citations: Citation[] }>; candidateGroups: CandidateGroup[] }

const [, , inventoryPath, reportPath] = process.argv
if (!inventoryPath || !reportPath) throw new Error('Usage: tsx scripts/compare-genesis-one.ts INVENTORY_JSON REPORT_MD')

const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as Inventory
const passageById = new Map(genesisOnePassages.map((passage) => [passage.id, passage.canonicalRef]))

const expand = (canonicalRef: string) => {
  const match = canonicalRef.match(/^(.+) (\d+):([\d,-]+)$/)
  if (!match) return { book: canonicalRef, chapter: 0, verses: [] as number[] }
  const [, book, chapter, selection] = match
  const verses = selection.split(',').flatMap((part) => {
    const [start, end] = part.split('-').map(Number)
    return end ? Array.from({ length: end - start + 1 }, (_, index) => start + index) : [start]
  })
  return { book, chapter: Number(chapter), verses: [...new Set(verses)].sort((a, b) => a - b) }
}

const semanticKey = (canonicalRef: string) => {
  const item = expand(canonicalRef)
  return `${item.book} ${item.chapter}:${item.verses.join(',')}`
}

const documentByAnchor = new Map<number, string[]>()
for (const group of inventory.candidateGroups.filter((item) => item.chapter === 1 && item.anchorVerses.length === 1)) {
  const refs = group.citations.map((citation) => citation.canonical_ref).filter((ref): ref is string => Boolean(ref))
  documentByAnchor.set(group.anchorVerses[0], refs)
}
const zeroSource = inventory.paragraphs.find((paragraph) => paragraph.chapter === null && paragraph.text.includes('משלי ח, כב-לא'))?.citations[0]?.canonical_ref
if (zeroSource) documentByAnchor.set(1, [zeroSource, ...(documentByAnchor.get(1) ?? [])])

const systemByAnchor = new Map<number, string[]>()
for (const ripple of genesisOneRipples) {
  const anchor = genesisOnePassages.find((passage) => passage.id === ripple.anchorPassageId)?.selection
  if (!anchor || anchor.kind !== 'range') continue
  const refs = ripple.members
    .filter((member) => member.passageId !== ripple.anchorPassageId)
    .map((member) => passageById.get(member.passageId))
    .filter((ref): ref is string => Boolean(ref))
  systemByAnchor.set(anchor.startVerse, [...(systemByAnchor.get(anchor.startVerse) ?? []), ...refs])
}

const trueOmissions: Array<{ anchor: number; ref: string }> = []
const redundantSubsets: Array<{ anchor: number; ref: string; coveredBy: string }> = []
for (const [anchor, documentRefs] of documentByAnchor) {
  const systemRefs = systemByAnchor.get(anchor) ?? []
  const systemKeys = new Set(systemRefs.map(semanticKey))
  for (const ref of [...new Set(documentRefs)]) {
    if (systemKeys.has(semanticKey(ref))) continue
    const candidate = expand(ref)
    const covering = systemRefs.find((existing) => {
      const baseline = expand(existing)
      return baseline.book === candidate.book && baseline.chapter === candidate.chapter && candidate.verses.every((verse) => baseline.verses.includes(verse))
    })
    if (covering) redundantSubsets.push({ anchor, ref, coveredBy: covering })
    else trueOmissions.push({ anchor, ref })
  }
}

const documentOccurrences = [...documentByAnchor.values()].reduce((total, refs) => total + refs.length, 0)
const systemOccurrences = genesisOneRipples.reduce((total, ripple) => total + ripple.members.filter((member) => member.passageId !== ripple.anchorPassageId).length, 0)
const lines = [
  '# השוואת כיול — בראשית פרק א׳', '',
  `- אדוות במערכת: ${genesisOneRipples.length}`,
  `- עוגנים בעלי מקורות במסמך: ${[...documentByAnchor.values()].filter((refs) => refs.length).length}`,
  `- מופעי מקורות במסמך: ${documentOccurrences}`,
  `- מופעי מקורות במערכת: ${systemOccurrences}`,
  `- מקורות אמיתיים שחסרים במערכת: ${trueOmissions.length}`,
  `- תתי־טווחים כפולים שכבר מכוסים: ${redundantSubsets.length}`, '',
  '## מקורות אמיתיים שחסרים בפיילוט', '',
  ...trueOmissions.map((item) => `- בראשית א:${item.anchor} ← ${item.ref}`), '',
  '## כפילויות/ייצוגים שאינם דורשים הוספה', '',
  ...redundantSubsets.map((item) => `- בראשית א:${item.anchor} ← ${item.ref} כבר מכוסה בתוך ${item.coveredBy}`), '',
  'ההשוואה סמנטית: טווח רציף ואוסף בדיד של אותם מספרי פסוקים נחשבים זהים.', '',
]

writeFileSync(reportPath, lines.join('\n'), 'utf8')
console.log(`Wrote Genesis 1 calibration report to ${reportPath}`)
