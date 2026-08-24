import type { EditorialRule, PassageRef, Proposal, Ripple } from './domain'

export type MockPassageRecord = PassageRef & { fallbackText: string }

const ref = (id: string, canonicalRef: string, book: string, bookTitleHe: string, bookOrder: number, chapter: number, startVerse: number, fallbackText: string, endVerse?: number): MockPassageRecord => ({ id, canonicalRef, book, bookTitleHe, bookOrder, chapter, startVerse, endVerse, fallbackText })

export const passages: MockPassageRecord[] = [
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

export const ripples: Ripple[] = [
  { id: 'creation', title: 'בריאת שמים וארץ', type: 'מקבילה תוכנית', explanation: 'פסוקים המתארים את בריאת הארץ והשמים בידי ה׳.', anchorPassageId: 'gen-1-1', status: 'approved', members: [
    { passageId: 'gen-1-1', role: 'עוגן' }, { passageId: 'isa-45-12', role: 'מקבילה' }, { passageId: 'ps-33-6', role: 'מקבילה', clarification: 'הבריאה בדבר ה׳' },
  ] },
  { id: 'servant-retelling', title: 'שליחות עבד אברהם — האירוע וסיפורו', type: 'סיפור מקביל', explanation: 'העבד חוזר בפני משפחת רבקה על שאירע בשליחותו.', anchorPassageId: 'gen-24-1-27', status: 'approved', members: [
    { passageId: 'gen-24-1-27', role: 'תיאור האירוע' }, { passageId: 'gen-24-34-48', role: 'סיפור חוזר' },
  ] },
  { id: 'noah-righteous', title: 'נח הצדיק בתוך דורו', type: 'ניגוד / מתח', explanation: 'צדקתו של נח מוצגת מול השחתת הארץ.', anchorPassageId: 'gen-6-9', status: 'approved', members: [
    { passageId: 'gen-6-9', role: 'עוגן' }, { passageId: 'gen-6-11', role: 'ניגוד' }, { passageId: 'gen-6-12', role: 'הרחבה' },
  ] },
]

export const editorialRules: EditorialRule[] = [
  { id: 'peshat', title: 'פשט ולא דרש', statement: 'קשר אפשרי אינו אדווה אוטומטית; המקור האחר צריך להאיר, להקביל, להשלים או להסביר את הכתוב.', status: 'established' },
  { id: 'full-quote', title: 'ציטוט מלא', statement: 'ככלל, מקור מקביל מובא במלואו ולא רק במילים הנוגעות לקשר.', status: 'established' },
  { id: 'wisdom-character', title: 'חכמה כללית ודמות מקראית', statement: 'טרם הוכרע מתי נכון לקשור אמרת חכמה כללית לדמות שנראית כממחישה אותה.', status: 'emerging' },
]

export const initialProposals: Proposal[] = [
  { id: 'proposal-noah-proverbs', title: 'נח הצדיק והמתהלך בתומו', proposer: 'יעל', passageIds: ['gen-6-9', 'prov-20-7'], proposedType: 'מקבילה תוכנית', reasoning: 'בשני הפסוקים מופיעים הצדיק, התמימות/התום וההליכה. ייתכן שמשלי מחדד את תיאורו של נח.', status: 'open', createdAt: '2026-08-21T09:30:00Z', comments: [
    { id: 'c1', author: 'מיכאל', body: 'הדמיון הלשוני משמעותי, אבל צריך להיזהר מהפיכת כל אמרת חכמה לתיאור של דמות.', createdAt: '2026-08-21T11:00:00Z' },
    { id: 'c2', author: 'יעל', body: 'מסכימה. כאן הצירוף של צדיק, תום והליכה מצמצם בעיניי את הקשר.', createdAt: '2026-08-21T12:15:00Z' },
  ] },
  { id: 'proposal-noah-wine', title: 'נח והאזהרה מן היין', proposer: 'דניאל', passageIds: ['gen-6-9', 'prov-20-1'], proposedType: 'הסבר', reasoning: 'סיפור נח עשוי להמחיש את האזהרה הכללית ממשלי.', status: 'rejected', createdAt: '2026-08-10T08:00:00Z', comments: [
    { id: 'c3', author: 'מיכאל', body: 'הפסוק הנבחר מתאר את צדקת נח ואינו עוסק ביין.', createdAt: '2026-08-10T10:00:00Z' },
  ], decision: { outcome: 'rejected', editor: 'העורך הראשי', reasoning: 'הקשר כללי ואסוציאטיבי מדי, ומקור העוגן אינו אירוע היין. אין כאן הסבר ישיר של הפסוק.', decidedAt: '2026-08-11T14:00:00Z', ruleIds: ['peshat', 'wisdom-character'] } },
]

export const passageById = (id: string) => passages.find((passage) => passage.id === id)!
export const referenceOf = (passage: PassageRef) => `${passage.bookTitleHe} ${passage.chapter}:${passage.startVerse}${passage.endVerse ? `–${passage.endVerse}` : ''}`
