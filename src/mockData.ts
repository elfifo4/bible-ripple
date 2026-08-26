import type { ContiguousPassageSelection, PassageRef, PassageSelection } from './domain'
import { genesisOnePassages } from './genesisOneData'
import { toHebrewNumeral } from './hebrewNumerals'

export type MockPassageRecord = PassageRef & { fallbackText: string }

const ref = (id: string, canonicalRef: string, book: string, bookTitleHe: string, bookOrder: number, chapter: number, startVerse: number, fallbackText: string, endVerse?: number): MockPassageRecord => ({ id, canonicalRef, book, bookTitleHe, bookOrder, chapter, selection: { kind: 'range', startVerse, endVerse }, fallbackText })

export const passageVerseNumbers = (passage: PassageRef): number[] => {
  const selection = passage.selection
  if (selection.kind === 'verses') return selection.verses
  return Array.from({ length: (selection.endVerse ?? selection.startVerse) - selection.startVerse + 1 }, (_, index) => selection.startVerse + index)
}

export const passageStartVerse = (passage: PassageRef): number => passage.selection.kind === 'range' ? passage.selection.startVerse : passage.selection.verses[0]

export const isSingleVerse = (selection: PassageSelection): selection is ContiguousPassageSelection & { endVerse?: undefined } => selection.kind === 'range' && selection.endVerse === undefined

const prototypePassages: MockPassageRecord[] = [
  ref('gen-1-1', 'Genesis 1:1', 'Genesis', 'בראשית', 1, 1, 1, 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ.'),
  ref('gen-1-2', 'Genesis 1:2', 'Genesis', 'בראשית', 1, 1, 2, 'וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל פְּנֵי תְהוֹם; וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל פְּנֵי הַמָּיִם.'),
  ref('gen-1-3', 'Genesis 1:3', 'Genesis', 'בראשית', 1, 1, 3, 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר; וַיְהִי אוֹר.'),
  ref('gen-6-8', 'Genesis 6:8', 'Genesis', 'בראשית', 1, 6, 8, 'וְנֹחַ מָצָא חֵן בְּעֵינֵי יְהוָה.'),
  ref('gen-6-9', 'Genesis 6:9', 'Genesis', 'בראשית', 1, 6, 9, 'אֵלֶּה תּוֹלְדֹת נֹחַ; נֹחַ אִישׁ צַדִּיק תָּמִים הָיָה בְּדֹרֹתָיו, אֶת הָאֱלֹהִים הִתְהַלֶּךְ נֹחַ.'),
  ref('gen-6-10', 'Genesis 6:10', 'Genesis', 'בראשית', 1, 6, 10, 'וַיּוֹלֶד נֹחַ שְׁלֹשָׁה בָנִים אֶת שֵׁם אֶת חָם וְאֶת יָפֶת.'),
  ref('gen-6-11', 'Genesis 6:11', 'Genesis', 'בראשית', 1, 6, 11, 'וַתִּשָּׁחֵת הָאָרֶץ לִפְנֵי הָאֱלֹהִים; וַתִּמָּלֵא הָאָרֶץ חָמָס.'),
  ref('gen-6-12', 'Genesis 6:12', 'Genesis', 'בראשית', 1, 6, 12, 'וַיַּרְא אֱלֹהִים אֶת הָאָרֶץ וְהִנֵּה נִשְׁחָתָה; כִּי הִשְׁחִית כָּל בָּשָׂר אֶת דַּרְכּוֹ עַל הָאָרֶץ.'),
  ref('gen-24-1-27', 'Genesis 24:1-27', 'Genesis', 'בראשית', 1, 24, 1, 'אברהם שולח את עבדו למצוא אשה ליצחק; העבד פוגש את רבקה ליד הבאר.', 27),
  ref('gen-24-34-48', 'Genesis 24:34-48', 'Genesis', 'בראשית', 1, 24, 34, 'העבד מספר למשפחת רבקה את שליחותו ואת אשר אירע ליד הבאר.', 48),
  ref('isa-45-12', 'Isaiah 45:12', 'Isaiah', 'ישעיהו', 12, 45, 12, 'אָנֹכִי עָשִׂיתִי אֶרֶץ וְאָדָם עָלֶיהָ בָרָאתִי; אֲנִי יָדַי נָטוּ שָׁמַיִם וְכָל צְבָאָם צִוֵּיתִי.'),
  ref('ps-33-6', 'Psalms 33:6', 'Psalms', 'תהלים', 27, 33, 6, 'בִּדְבַר יְהוָה שָׁמַיִם נַעֲשׂוּ; וּבְרוּחַ פִּיו כָּל צְבָאָם.'),
  ref('prov-20-7', 'Proverbs 20:7', 'Proverbs', 'משלי', 28, 20, 7, 'מִתְהַלֵּךְ בְּתֻמּוֹ צַדִּיק; אַשְׁרֵי בָנָיו אַחֲרָיו.'),
  ref('prov-20-1', 'Proverbs 20:1', 'Proverbs', 'משלי', 28, 20, 1, 'לֵץ הַיַּיִן הֹמֶה שֵׁכָר; וְכָל שֹׁגֶה בּוֹ לֹא יֶחְכָּם.'),
]

export const passages: MockPassageRecord[] = [...new Map(
  [...genesisOnePassages, ...prototypePassages].map((passage) => [passage.id, passage]),
).values()]

export const passageById = (id: string) => passages.find((passage) => passage.id === id)!
export const referenceOf = (passage: PassageRef) => {
  const verses = passage.selection.kind === 'range'
    ? `${toHebrewNumeral(passage.selection.startVerse)}${passage.selection.endVerse ? `–${toHebrewNumeral(passage.selection.endVerse)}` : ''}`
    : passage.selection.verses.map(toHebrewNumeral).join(', ')
  return `${passage.bookTitleHe} ${toHebrewNumeral(passage.chapter)}:${verses}`
}
