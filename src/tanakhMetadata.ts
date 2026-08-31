export type TanakhBook = { book: string; titleHe: string; chapters: number }

export const tanakhBooks: TanakhBook[] = [
  ['Genesis', 'בראשית', 50], ['Exodus', 'שמות', 40], ['Leviticus', 'ויקרא', 27], ['Numbers', 'במדבר', 36], ['Deuteronomy', 'דברים', 34],
  ['Joshua', 'יהושע', 24], ['Judges', 'שופטים', 21], ['I Samuel', 'שמואל א', 31], ['II Samuel', 'שמואל ב', 24], ['I Kings', 'מלכים א', 22], ['II Kings', 'מלכים ב', 25],
  ['Isaiah', 'ישעיהו', 66], ['Jeremiah', 'ירמיהו', 52], ['Ezekiel', 'יחזקאל', 48], ['Hosea', 'הושע', 14], ['Joel', 'יואל', 4], ['Amos', 'עמוס', 9], ['Obadiah', 'עובדיה', 1], ['Jonah', 'יונה', 4], ['Micah', 'מיכה', 7], ['Nahum', 'נחום', 3], ['Habakkuk', 'חבקוק', 3], ['Zephaniah', 'צפניה', 3], ['Haggai', 'חגי', 2], ['Zechariah', 'זכריה', 14], ['Malachi', 'מלאכי', 3],
  ['Psalms', 'תהלים', 150], ['Proverbs', 'משלי', 31], ['Job', 'איוב', 42], ['Song of Songs', 'שיר השירים', 8], ['Ruth', 'רות', 4], ['Lamentations', 'איכה', 5], ['Ecclesiastes', 'קהלת', 12], ['Esther', 'אסתר', 10], ['Daniel', 'דניאל', 12], ['Ezra', 'עזרא', 10], ['Nehemiah', 'נחמיה', 13], ['I Chronicles', 'דברי הימים א', 29], ['II Chronicles', 'דברי הימים ב', 36],
].map(([book, titleHe, chapters]) => ({ book: String(book), titleHe: String(titleHe), chapters: Number(chapters) }))

export const tanakhBook = (book: string) => tanakhBooks.find((item) => item.book === book)
