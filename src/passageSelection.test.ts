import { describe, expect, it } from 'vitest'
import { MockBibleTextProvider } from './bibleTextProvider'
import type { PassageRef } from './domain'
import { passageVerseNumbers, referenceOf } from './mockData'

const discretePassage: PassageRef = {
  id: 'ps-104-2-5',
  canonicalRef: 'Psalms 104:2,5',
  book: 'Psalms',
  bookTitleHe: 'תהלים',
  bookOrder: 27,
  chapter: 104,
  selection: { kind: 'verses', verses: [2, 5] },
}

describe('passage selections', () => {
  it('formats a discrete collection without presenting it as a range', () => {
    expect(referenceOf(discretePassage)).toBe('תהלים קד:ב, ה')
    expect(passageVerseNumbers(discretePassage)).toEqual([2, 5])
  })

  it('joins discrete verse texts with an explicit omission marker', async () => {
    const provider = new MockBibleTextProvider()
    const passage = await provider.getPassage({
      ...discretePassage,
      id: 'gen-1-1-3',
      canonicalRef: 'Genesis 1:1,3',
      book: 'Genesis',
      bookTitleHe: 'בראשית',
      bookOrder: 1,
      chapter: 1,
      selection: { kind: 'verses', verses: [1, 3] },
    })

    expect(passage.text).toContain('בְּרֵאשִׁית')
    expect(passage.text).toContain('[…]')
    expect(passage.text).toContain('יְהִי אוֹר')
  })
})
