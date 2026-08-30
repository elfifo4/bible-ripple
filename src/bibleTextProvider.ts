import type { BibleChapter, BiblePassage, PassageRef } from './domain'
import { isSingleVerse, passages, passageVerseNumbers, type MockPassageRecord } from './mockData'

export const SEFARIA_VERSION = "Tanach with Ta'amei Hamikra"
const SEFARIA_API = 'https://www.sefaria.org/api/v3/texts'

export const sefariaPageUrl = (ref: PassageRef): string => {
  const pageRef = ref.canonicalRef
    .replace(/\s+(?=\d)/, '.')
    .replace(':', '.')
    .replaceAll(' ', '_')
  return `https://www.sefaria.org/${encodeURI(pageRef)}?lang=he&aliyot=0`
}

export interface BibleTextProvider {
  getPassage(ref: PassageRef): Promise<BiblePassage>
  getChapter(book: string, bookTitleHe: string, chapter: number): Promise<BibleChapter>
}

type SefariaResponse = {
  ref: string
  versions: Array<{ text: string | string[]; versionTitle: string; license?: string }>
}

const passageRef = (book: string, bookTitleHe: string, chapter: number, verse: number): PassageRef => ({
  id: `${book.toLowerCase()}-${chapter}-${verse}`,
  canonicalRef: `${book} ${chapter}:${verse}`,
  book,
  bookTitleHe,
  bookOrder: 0,
  chapter,
  selection: { kind: 'range', startVerse: verse },
})

export class SefariaBibleTextProvider implements BibleTextProvider {
  private cache = new Map<string, Promise<SefariaResponse>>()

  private fetch(ref: string) {
    if (!this.cache.has(ref)) {
      const params = new URLSearchParams({ version: `hebrew|${SEFARIA_VERSION}`, return_format: 'text_only' })
      this.cache.set(ref, window.fetch(`${SEFARIA_API}/${encodeURIComponent(ref)}?${params}`).then(async (response) => {
        if (!response.ok) throw new Error(`Sefaria request failed (${response.status})`)
        const data = await response.json() as SefariaResponse
        if (!data.versions?.[0]?.text) throw new Error('Sefaria returned no Hebrew text')
        return data
      }))
    }
    return this.cache.get(ref)!
  }

  async getPassage(ref: PassageRef): Promise<BiblePassage> {
    if (ref.selection.kind === 'verses') {
      const data = await Promise.all(ref.selection.verses.map((verse) => this.fetch(`${ref.book} ${ref.chapter}:${verse}`)))
      const versions = data.map((item) => item.versions[0])
      return {
        ref,
        text: versions.map((version) => Array.isArray(version.text) ? version.text.join(' ') : version.text).join(' […] '),
        source: 'sefaria',
        versionTitle: versions[0].versionTitle,
        license: versions[0].license ?? 'Public Domain',
      }
    }
    const data = await this.fetch(ref.canonicalRef)
    const version = data.versions[0]
    return { ref: { ...ref, canonicalRef: data.ref }, text: Array.isArray(version.text) ? version.text.join(' ') : version.text, source: 'sefaria', versionTitle: version.versionTitle, license: version.license ?? 'Public Domain' }
  }

  async getChapter(book: string, bookTitleHe: string, chapter: number): Promise<BibleChapter> {
    const data = await this.fetch(`${book} ${chapter}`)
    const version = data.versions[0]
    const texts = Array.isArray(version.text) ? version.text : [version.text]
    return { book, bookTitleHe, chapter, source: 'sefaria', verses: texts.map((text, index) => ({ ref: passageRef(book, bookTitleHe, chapter, index + 1), text, source: 'sefaria', versionTitle: version.versionTitle, license: version.license ?? 'Public Domain' })) }
  }
}

export class MockBibleTextProvider implements BibleTextProvider {
  async getPassage(ref: PassageRef): Promise<BiblePassage> {
    const record = passages.find((item) => item.canonicalRef === ref.canonicalRef) as MockPassageRecord | undefined
    const fallback = passageVerseNumbers(ref).map((verse) => passages.find((item) => item.book === ref.book && item.chapter === ref.chapter && isSingleVerse(item.selection) && item.selection.startVerse === verse)?.fallbackText).filter(Boolean).join(' […] ')
    return { ref, text: record?.fallbackText ?? (fallback || 'הטקסט אינו זמין במצב המקומי.'), source: 'mock', versionTitle: 'Local prototype fallback', license: 'Prototype data' }
  }

  async getChapter(book: string, bookTitleHe: string, chapter: number): Promise<BibleChapter> {
    const records = passages.filter((item) => item.book === book && item.chapter === chapter && isSingleVerse(item.selection))
    return { book, bookTitleHe, chapter, source: 'mock', verses: records.map((record) => ({ ref: record, text: record.fallbackText, source: 'mock', versionTitle: 'Local prototype fallback', license: 'Prototype data' })) }
  }
}

export class FallbackBibleTextProvider implements BibleTextProvider {
  constructor(private primary: BibleTextProvider, private fallback: BibleTextProvider) {}
  async getPassage(ref: PassageRef) { try { return await this.primary.getPassage(ref) } catch { return this.fallback.getPassage(ref) } }
  async getChapter(book: string, bookTitleHe: string, chapter: number) { try { return await this.primary.getChapter(book, bookTitleHe, chapter) } catch { return this.fallback.getChapter(book, bookTitleHe, chapter) } }
}

export const liveBibleTextProvider = new FallbackBibleTextProvider(new SefariaBibleTextProvider(), new MockBibleTextProvider())
