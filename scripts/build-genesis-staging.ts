import { readFileSync, writeFileSync } from 'node:fs'

type Selection = { kind: 'range'; startVerse: number; endVerse?: number } | { kind: 'verses'; verses: number[] }
type Citation = {
  raw: string
  book_he: string
  canonical_ref: string | null
  chapter: number | null
  selection: Selection | null
  error: string | null
}
type Paragraph = { index: number; text: string; citations: Citation[] }
type CandidateGroup = {
  chapter: number
  anchorVerses: number[]
  paragraphIndexes: number[]
  citations: Citation[]
  hasYellow: boolean
  hasUncertainty: boolean
  flags: string[]
}
type Inventory = {
  source: { filename: string; sha256: string }
  paragraphs: Paragraph[]
  candidateGroups: CandidateGroup[]
}

type SefariaValidation = { status: 'valid' | 'invalid' | 'not-checked'; checkedRefs: string[]; errors: string[] }

const args = process.argv.slice(2)
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}
const inventoryPath = valueAfter('--inventory')
const outputPath = valueAfter('--output')
const reportPath = valueAfter('--report')
const chaptersArgument = valueAfter('--chapters') ?? '2-5'
const validateSefaria = args.includes('--validate-sefaria')
if (!inventoryPath || !outputPath || !reportPath) {
  throw new Error('Usage: tsx scripts/build-genesis-staging.ts --inventory FILE --output FILE --report FILE [--chapters 2-5] [--validate-sefaria]')
}

const [chapterStart, chapterEnd] = chaptersArgument.split('-').map(Number)
if (!chapterStart || !chapterEnd || chapterEnd < chapterStart) throw new Error(`Invalid chapter range: ${chaptersArgument}`)

const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as Inventory
const paragraphs = new Map(inventory.paragraphs.map((paragraph) => [paragraph.index, paragraph]))

const selectionFor = (verses: number[]): Selection => {
  const sorted = [...new Set(verses)].sort((a, b) => a - b)
  const contiguous = sorted.every((verse, index) => index === 0 || verse === sorted[index - 1] + 1)
  if (contiguous) return { kind: 'range', startVerse: sorted[0], ...(sorted.length > 1 ? { endVerse: sorted.at(-1) } : {}) }
  return { kind: 'verses', verses: sorted }
}

const canonicalFor = (book: string, chapter: number, selection: Selection) => {
  const suffix = selection.kind === 'range'
    ? `${selection.startVerse}${selection.endVerse ? `-${selection.endVerse}` : ''}`
    : selection.verses.join(',')
  return `${book} ${chapter}:${suffix}`
}

const semanticKey = (citation: Citation) => citation.canonical_ref ?? citation.raw

const validationRefs = (canonicalRef: string, selection: Selection): string[] => {
  if (selection.kind === 'range') return [canonicalRef]
  const match = canonicalRef.match(/^(.+) (\d+):/)
  if (!match) return [canonicalRef]
  return selection.verses.map((verse) => `${match[1]} ${match[2]}:${verse}`)
}

const validate = async (refs: string[]): Promise<SefariaValidation> => {
  if (!validateSefaria) return { status: 'not-checked', checkedRefs: [], errors: [] }
  const errors: string[] = []
  const uniqueRefs = [...new Set(refs)]
  let cursor = 0
  const workers = Array.from({ length: Math.min(4, uniqueRefs.length) }, async () => {
    while (cursor < uniqueRefs.length) {
      const ref = uniqueRefs[cursor++]
      try {
        const params = new URLSearchParams({ version: "hebrew|Tanach with Ta'amei Hamikra", return_format: 'text_only' })
        const response = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}?${params}`)
        if (!response.ok) errors.push(`${ref}: HTTP ${response.status}`)
        else {
          const data = await response.json() as { versions?: Array<{ text?: string | string[] }> }
          if (!data.versions?.[0]?.text) errors.push(`${ref}: no Hebrew text returned`)
        }
      } catch (error) {
        errors.push(`${ref}: ${error instanceof Error ? error.message : 'request failed'}`)
      }
    }
  })
  await Promise.all(workers)
  return { status: errors.length ? 'invalid' : 'valid', checkedRefs: uniqueRefs, errors }
}

const groups = inventory.candidateGroups.filter((group) =>
  group.chapter >= chapterStart && group.chapter <= chapterEnd && group.citations.length > 0,
)

const candidates = []
for (const group of groups) {
  const anchorSelection = selectionFor(group.anchorVerses)
  const sources = [...new Map(group.citations.map((citation) => [semanticKey(citation), citation])).values()]
  const reviewReasons = [
    ...(group.anchorVerses.length > 1 ? ['anchor-spans-multiple-verses'] : []),
    ...(group.hasUncertainty ? ['editorial-uncertainty-in-source'] : []),
    ...(sources.some((citation) => citation.error || !citation.canonical_ref || !citation.selection) ? ['unresolved-citation'] : []),
  ]
  const refsToValidate = [canonicalFor('Genesis', group.chapter, anchorSelection)]
  for (const source of sources) {
    if (source.canonical_ref && source.selection) refsToValidate.push(...validationRefs(source.canonical_ref, source.selection))
  }
  const sefaria = await validate(refsToValidate)
  if (sefaria.status === 'invalid') reviewReasons.push('sefaria-validation-failed')
  candidates.push({
    id: `staging-gen-${group.chapter}-${group.anchorVerses.join('-')}`,
    kind: 'ripple-import-candidate',
    status: reviewReasons.length ? 'needs-review' : 'ready-for-editorial-metadata',
    title: null,
    proposedType: null,
    approvalSignal: group.hasYellow ? 'yellow-anchor' : 'none',
    anchor: {
      canonicalRef: canonicalFor('Genesis', group.chapter, anchorSelection),
      book: 'Genesis',
      bookTitleHe: 'בראשית',
      chapter: group.chapter,
      selection: anchorSelection,
    },
    sources: sources.map((citation) => ({
      rawReference: citation.raw,
      canonicalRef: citation.canonical_ref,
      bookTitleHe: citation.book_he,
      chapter: citation.chapter,
      selection: citation.selection,
      parseError: citation.error,
    })),
    reviewReasons,
    sefaria,
    trace: {
      sourceSha256: inventory.source.sha256,
      paragraphIndexes: group.paragraphIndexes,
      excerpts: group.paragraphIndexes.map((index) => paragraphs.get(index)?.text).filter(Boolean),
    },
  })
}

const summary = {
  chapters: { start: chapterStart, end: chapterEnd },
  candidates: candidates.length,
  readyForEditorialMetadata: candidates.filter((candidate) => candidate.status === 'ready-for-editorial-metadata').length,
  needsReview: candidates.filter((candidate) => candidate.status === 'needs-review').length,
  sourceOccurrences: candidates.reduce((total, candidate) => total + candidate.sources.length, 0),
  sefariaValidated: candidates.filter((candidate) => candidate.sefaria.status === 'valid').length,
  sefariaFailures: candidates.flatMap((candidate) => candidate.sefaria.errors).length,
}

writeFileSync(outputPath, JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), source: inventory.source, summary, candidates }, null, 2), 'utf8')

const byChapter = Array.from({ length: chapterEnd - chapterStart + 1 }, (_, index) => chapterStart + index).map((chapter) => {
  const items = candidates.filter((candidate) => candidate.anchor.chapter === chapter)
  return { chapter, candidates: items.length, ready: items.filter((candidate) => candidate.status === 'ready-for-editorial-metadata').length, review: items.filter((candidate) => candidate.status === 'needs-review').length, sources: items.reduce((total, candidate) => total + candidate.sources.length, 0) }
})
const report = [
  `# Staging — בראשית פרקים ${chapterStart}–${chapterEnd}`,
  '',
  '- מצב: staging פרטי בלבד; לא נכתב דבר ל־Firestore.',
  `- מועמדים: ${summary.candidates}`,
  `- מוכנים להשלמת כותרת וסוג: ${summary.readyForEditorialMetadata}`,
  `- דורשים סקירה מבנית/עריכתית: ${summary.needsReview}`,
  `- מקורות מנורמלים: ${summary.sourceOccurrences}`,
  `- מועמדים שעברו אימות מלא בספריא: ${summary.sefariaValidated}`,
  `- כשלי אימות ספריא: ${summary.sefariaFailures}`,
  '',
  '| פרק | מועמדים | מבנה נקי | לסקירה | מקורות |',
  '|---:|---:|---:|---:|---:|',
  ...byChapter.map((item) => `| ${item.chapter} | ${item.candidates} | ${item.ready} | ${item.review} | ${item.sources} |`),
  '',
  '## מועמדים הדורשים סקירה',
  '',
  ...candidates.filter((candidate) => candidate.status === 'needs-review').map((candidate) => `- ${candidate.anchor.canonicalRef}: ${candidate.reviewReasons.join(', ')}`),
  '',
  '## שדות שלא הוכרעו',
  '',
  '- `title` נשאר ריק כדי שלא להמציא כותרת שאינה במסמך.',
  '- `proposedType` נשאר ריק כדי שלא להכריע בסוג האדווה ללא החלטה עריכתית.',
  '- מועמד מרובה־פסוקים נשמר כטווח רציף או כאוסף בדיד, אך מסומן לסקירה לפני ייבוא.',
  '',
].join('\n')
writeFileSync(reportPath, report, 'utf8')

console.log(`Wrote ${candidates.length} private staging candidates to ${outputPath}`)
console.log(`Wrote staging report to ${reportPath}`)
