import type { PassageRef, PassageSelection, Ripple } from './domain'

type PassageRecord = PassageRef & { fallbackText: string }

type Book = [name: string, titleHe: string, order: number]
type Source = [book: Book, chapter: number, selection: PassageSelection]
type RippleSource = Source | { ref: Source; role?: string; clarification?: string }

const GENESIS: Book = ['Genesis', 'בראשית', 1]
const LEVITICUS: Book = ['Leviticus', 'ויקרא', 3]
const DEUTERONOMY: Book = ['Deuteronomy', 'דברים', 5]
const I_SAMUEL: Book = ['I Samuel', 'שמואל א', 8]
const II_KINGS: Book = ['II Kings', 'מלכים ב', 11]
const ISAIAH: Book = ['Isaiah', 'ישעיהו', 12]
const JEREMIAH: Book = ['Jeremiah', 'ירמיהו', 13]
const AMOS: Book = ['Amos', 'עמוס', 17]
const JONAH: Book = ['Jonah', 'יונה', 19]
const ZECHARIAH: Book = ['Zechariah', 'זכריה', 25]
const MALACHI: Book = ['Malachi', 'מלאכי', 26]
const PSALMS: Book = ['Psalms', 'תהלים', 27]
const PROVERBS: Book = ['Proverbs', 'משלי', 28]
const JOB: Book = ['Job', 'איוב', 29]
const ECCLESIASTES: Book = ['Ecclesiastes', 'קהלת', 33]
const NEHEMIAH: Book = ['Nehemiah', 'נחמיה', 37]
const I_CHRONICLES: Book = ['I Chronicles', 'דברי הימים א', 38]
const II_CHRONICLES: Book = ['II Chronicles', 'דברי הימים ב', 39]

const one = (startVerse: number, endVerse?: number): PassageSelection => ({ kind: 'range', startVerse, endVerse })
const many = (...verses: [number, ...number[]]): PassageSelection => ({ kind: 'verses', verses })
const source = (book: Book, chapter: number, selection: PassageSelection): Source => [book, chapter, selection]
const note = (ref: Source, clarification: string, role?: string): RippleSource => ({ ref, clarification, role })

const canonicalOf = ([book]: Book, chapter: number, selection: PassageSelection) => {
  const verses = selection.kind === 'range'
    ? `${selection.startVerse}${selection.endVerse ? `-${selection.endVerse}` : ''}`
    : selection.verses.join(',')
  return `${book} ${chapter}:${verses}`
}

const bookId: Record<string, string> = {
  Genesis: 'gen', Leviticus: 'lev', Deuteronomy: 'deut', 'I Samuel': '1sam', 'II Kings': '2kgs',
  Isaiah: 'isa', Jeremiah: 'jer', Amos: 'amos', Jonah: 'jonah', Zechariah: 'zech', Malachi: 'mal',
  Psalms: 'ps', Proverbs: 'prov', Job: 'job', Ecclesiastes: 'eccl', Nehemiah: 'neh',
  'I Chronicles': '1chr', 'II Chronicles': '2chr',
}

const idOf = ([book]: Book, chapter: number, selection: PassageSelection) => {
  const verses = selection.kind === 'range'
    ? `${selection.startVerse}${selection.endVerse ? `-${selection.endVerse}` : ''}`
    : selection.verses.join('-')
  return `${bookId[book]}-${chapter}-${verses}`
}
const catalog = new Map<string, PassageRecord>()

const register = ([book, chapter, selection]: Source) => {
  const canonicalRef = canonicalOf(book, chapter, selection)
  const id = idOf(book, chapter, selection)
  if (!catalog.has(id)) catalog.set(id, {
    id,
    canonicalRef,
    book: book[0],
    bookTitleHe: book[1],
    bookOrder: book[2],
    chapter,
    selection,
    fallbackText: 'הטקסט אינו זמין במצב המקומי.',
  })
  return id
}

const genesis = (verse: number) => register(source(GENESIS, 1, one(verse)))
for (let verse = 1; verse <= 31; verse += 1) genesis(verse)

const ripple = (id: string, title: string, anchorVerse: number, sources: RippleSource[], type = 'מקבילה תוכנית'): Ripple => {
  const anchorPassageId = genesis(anchorVerse)
  return {
    id,
    title,
    type,
    anchorPassageId,
    status: 'approved',
    members: [
      { passageId: anchorPassageId, role: 'עוגן' },
      ...sources.map((item) => Array.isArray(item)
        ? { passageId: register(item), role: 'מקבילה' }
        : { passageId: register(item.ref), role: item.role ?? 'מקבילה', clarification: item.clarification }),
    ],
  }
}

export const genesisOneRipples: Ripple[] = [
  ripple('gen-1-1-before-creation', 'החכמה לפני בריאת העולם', 1, [
    note(source(PROVERBS, 8, one(22, 31)), 'החכמה מתארת את ראשיתה ואת נוכחותה לפני כינון השמים והארץ.', 'רקע מקדים'),
  ], 'השלמה כרונולוגית'),
  ripple('gen-1-1-creation', 'בריאת השמים והארץ', 1, [
    source(JOB, 38, one(4, 6)), source(PROVERBS, 3, one(19)), source(JOB, 26, one(7)),
    source(PSALMS, 33, one(6)), source(PSALMS, 89, one(12, 13)), source(PSALMS, 102, one(26)),
    source(PSALMS, 104, many(2, 5)), source(PSALMS, 115, one(15)), source(PSALMS, 121, one(2)),
    source(PSALMS, 124, one(8)), source(PSALMS, 134, one(3)), source(PSALMS, 146, one(6)),
    source(I_SAMUEL, 2, one(8)), source(II_KINGS, 19, one(15)), source(ISAIAH, 37, one(16)),
    source(ISAIAH, 42, one(5)), source(ISAIAH, 44, one(24)), source(ISAIAH, 45, one(18)),
    source(ISAIAH, 40, one(21, 22)), source(ZECHARIAH, 12, one(1)), source(ISAIAH, 45, one(12)),
    source(ISAIAH, 48, one(13)), source(JEREMIAH, 10, one(12)), source(JEREMIAH, 51, one(15)),
    source(JEREMIAH, 32, one(17)), source(AMOS, 9, one(6)), source(II_CHRONICLES, 2, one(11)),
  ]),
  ripple('gen-1-1-enduring-earth', 'קיומה הנצחי של הארץ', 1, [
    source(ECCLESIASTES, 1, one(4)), source(PSALMS, 93, one(1)), source(PSALMS, 96, one(10)),
    source(I_CHRONICLES, 16, one(30)), note(source(JEREMIAH, 10, one(11)), 'תרגום: כך תאמרו להם: האלוהים אשר את השמים ואת הארץ לא עשו – יאבדו מן הארץ ומתחת שמים אלה.'),
  ], 'ניגוד / מתח'),
  ripple('gen-1-3-spoken-light', 'האמירה והאור', 3, [source(PSALMS, 33, one(9)), source(PSALMS, 104, one(2))]),
  ripple('gen-1-5-light-and-darkness', 'אור וחושך', 5, [source(ISAIAH, 45, one(7))]),
  ripple('gen-1-8-heavens', 'הרקיע והשמים', 8, [
    source(PSALMS, 19, one(2)), source(PSALMS, 90, one(2)), source(PSALMS, 104, one(3)),
    source(PSALMS, 136, one(4, 6)), source(PSALMS, 96, one(5)), source(I_CHRONICLES, 16, one(26)),
    source(PSALMS, 148, many(4, 5)), source(JOB, 9, one(8)), source(ISAIAH, 45, one(12)),
  ]),
  ripple('gen-1-10-sea-and-land', 'הים, היבשה וגבולות המים', 10, [
    source(PSALMS, 24, one(1, 2)), source(PSALMS, 33, one(7)), source(PSALMS, 104, many(6, 9)),
    source(JEREMIAH, 5, one(22)), source(PSALMS, 146, one(6)), source(PROVERBS, 8, one(28, 30)),
    source(JOB, 9, one(8)), source(JOB, 26, one(10)), source(JOB, 38, one(8, 11)),
    source(ZECHARIAH, 12, one(1)), source(ISAIAH, 40, one(12, 14)), source(JONAH, 1, one(9)),
  ]),
  ripple('gen-1-11-vegetation', 'בריאת הצומח', 11, [source(AMOS, 4, one(13)), source(PSALMS, 148, many(5, 9))]),
  ripple('gen-1-14-appointed-times', 'המאורות והמועדים', 14, [source(LEVITICUS, 23, one(4))]),
  ripple('gen-1-16-luminaries', 'השמש, הירח והכוכבים', 16, [
    source(ISAIAH, 40, one(26)), source(ISAIAH, 45, one(12)), source(NEHEMIAH, 9, one(6)),
    note(source(JOB, 9, one(9)), 'עש, כסיל וכימה הם שמות של כוכבים.'), source(AMOS, 5, one(8)), source(PSALMS, 8, one(4)),
    source(PSALMS, 104, one(20, 22)), source(PSALMS, 147, one(4)), source(PSALMS, 148, many(2, 3, 5, 6)),
  ]),
  ripple('gen-1-19-day-and-night', 'ממשלת היום והלילה', 19, [
    source(PSALMS, 74, one(16, 17)), source(PSALMS, 104, one(19)), source(PSALMS, 136, one(7, 9)),
    source(JEREMIAH, 31, one(35)), source(JEREMIAH, 31, one(34, 35)),
  ]),
  ripple('gen-1-21-sea-creatures', 'בריאת חיות המים והתנינים', 21, [
    source(JOB, 40, many(15, 19, 25)), source(PSALMS, 104, one(24, 26)),
    source(JOB, 12, one(7, 10)), source(PSALMS, 148, many(5, 7)),
  ]),
  ripple('gen-1-25-land-animals', 'בריאת חיות הארץ', 25, [source(PSALMS, 148, many(5, 10))]),
  ripple('gen-1-27-humanity', 'בריאת האדם בצלם אלוהים', 27, [
    source(GENESIS, 5, one(1)), source(GENESIS, 9, one(6)), source(DEUTERONOMY, 4, one(32)),
    source(MALACHI, 2, one(10)), source(PSALMS, 139, one(13, 16)), source(ISAIAH, 29, one(16)),
    source(ISAIAH, 45, one(9)), source(ISAIAH, 64, one(7)), source(JEREMIAH, 18, one(6)),
    source(JOB, 4, many(17, 19)), source(JOB, 10, one(8, 11)), source(JOB, 33, one(4)),
    source(ZECHARIAH, 12, one(1)), source(ECCLESIASTES, 12, one(7)), source(PSALMS, 103, one(14)),
    source(ECCLESIASTES, 3, one(18, 21)),
  ]),
  ripple('gen-1-28-human-dominion', 'ברכת האדם ושלטונו בבריאה', 28, [
    source(GENESIS, 9, one(1)), source(PSALMS, 8, one(6, 9)), source(PSALMS, 115, one(16)),
    source(ISAIAH, 45, one(18)),
  ]),
  ripple('gen-1-29-human-food', 'מזונו המקורי של האדם', 29, [source(GENESIS, 9, one(3))], 'ניגוד / מתח'),
  ripple('gen-1-30-animal-food', 'מזון בעלי החיים', 30, [
    source(PSALMS, 145, one(15, 16)), source(ISAIAH, 11, one(7)), source(ISAIAH, 65, one(25)),
  ]),
  ripple('gen-1-31-good-creation', 'שלמות הבריאה', 31, [
    source(PSALMS, 104, one(24)), source(PSALMS, 104, one(31)), source(ISAIAH, 45, one(12)),
  ]),
]

export const genesisOnePassages = [...catalog.values()]
