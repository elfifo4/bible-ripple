import type { BibleChapter, BiblePassage, PassageRef } from './domain'
import { passages, type MockPassageRecord } from './mockData'

export const SEFARIA_VERSION = "Tanach with Ta'amei Hamikra"
const SEFARIA_API = 'https://www.sefaria.org/api/v3/texts'

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
  startVerse: verse,
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
    return { ref, text: record?.fallbackText ?? 'הטקסט אינו זמין במצב המקומי.', source: 'mock', versionTitle: 'Local prototype fallback', license: 'Prototype data' }
  }

  async getChapter(book: string, bookTitleHe: string, chapter: number): Promise<BibleChapter> {
    const records = passages.filter((item) => item.book === book && item.chapter === chapter && !item.endVerse)
    return { book, bookTitleHe, chapter, source: 'mock', verses: records.map((record) => ({ ref: record, text: record.fallbackText, source: 'mock', versionTitle: 'Local prototype fallback', license: 'Prototype data' })) }
  }
}

export class FallbackBibleTextProvider implements BibleTextProvider {
  constructor(private primary: BibleTextProvider, private fallback: BibleTextProvider) {}
  async getPassage(ref: PassageRef) { try { return await this.primary.getPassage(ref) } catch { return this.fallback.getPassage(ref) } }
  async getChapter(book: string, bookTitleHe: string, chapter: number) { try { return await this.primary.getChapter(book, bookTitleHe, chapter) } catch { return this.fallback.getChapter(book, bookTitleHe, chapter) } }
}

export const liveBibleTextProvider = new FallbackBibleTextProvider(new SefariaBibleTextProvider(), new MockBibleTextProvider())
