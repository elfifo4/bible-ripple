import type { EditorialRule, Passage, Proposal, Ripple } from './domain'

export const passages: Passage[] = [
  { id: 'gen-1-1', book: 'בראשית', bookOrder: 1, chapter: 1, startVerse: 1, text: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ.' },
  { id: 'gen-1-2', book: 'בראשית', bookOrder: 1, chapter: 1, startVerse: 2, text: 'וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל פְּנֵי תְהוֹם; וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל פְּנֵי הַמָּיִם.' },
  { id: 'gen-1-3', book: 'בראשית', bookOrder: 1, chapter: 1, startVerse: 3, text: 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר; וַיְהִי אוֹר.' },
  { id: 'gen-6-8', book: 'בראשית', bookOrder: 1, chapter: 6, startVerse: 8, text: 'וְנֹחַ מָצָא חֵן בְּעֵינֵי יְהוָה.' },
  { id: 'gen-6-9', book: 'בראשית', bookOrder: 1, chapter: 6, startVerse: 9, text: 'אֵלֶּה תּוֹלְדֹת נֹחַ; נֹחַ אִישׁ צַדִּיק תָּמִים הָיָה בְּדֹרֹתָיו, אֶת הָאֱלֹהִים הִתְהַלֶּךְ נֹחַ.' },
  { id: 'gen-6-10', book: 'בראשית', bookOrder: 1, chapter: 6, startVerse: 10, text: 'וַיּוֹלֶד נֹחַ שְׁלֹשָׁה בָנִים אֶת שֵׁם אֶת חָם וְאֶת יָפֶת.' },
  { id: 'gen-6-11', book: 'בראשית', bookOrder: 1, chapter: 6, startVerse: 11, text: 'וַתִּשָּׁחֵת הָאָרֶץ לִפְנֵי הָאֱלֹהִים; וַתִּמָּלֵא הָאָרֶץ חָמָס.' },
  { id: 'gen-6-12', book: 'בראשית', bookOrder: 1, chapter: 6, startVerse: 12, text: 'וַיַּרְא אֱלֹהִים אֶת הָאָרֶץ וְהִנֵּה נִשְׁחָתָה; כִּי הִשְׁחִית כָּל בָּשָׂר אֶת דַּרְכּוֹ עַל הָאָרֶץ.' },
  { id: 'gen-24-1-27', book: 'בראשית', bookOrder: 1, chapter: 24, startVerse: 1, endVerse: 27, text: 'אברהם שולח את עבדו למצוא אשה ליצחק; העבד פוגש את רבקה ליד הבאר.' },
  { id: 'gen-24-34-48', book: 'בראשית', bookOrder: 1, chapter: 24, startVerse: 34, endVerse: 48, text: 'העבד מספר למשפחת רבקה את שליחותו ואת אשר אירע ליד הבאר.' },
  { id: 'isa-45-12', book: 'ישעיהו', bookOrder: 12, chapter: 45, startVerse: 12, text: 'אָנֹכִי עָשִׂיתִי אֶרֶץ וְאָדָם עָלֶיהָ בָרָאתִי; אֲנִי יָדַי נָטוּ שָׁמַיִם וְכָל צְבָאָם צִוֵּיתִי.' },
  { id: 'ps-33-6', book: 'תהלים', bookOrder: 27, chapter: 33, startVerse: 6, text: 'בִּדְבַר יְהוָה שָׁמַיִם נַעֲשׂוּ; וּבְרוּחַ פִּיו כָּל צְבָאָם.' },
  { id: 'prov-20-7', book: 'משלי', bookOrder: 28, chapter: 20, startVerse: 7, text: 'מִתְהַלֵּךְ בְּתֻמּוֹ צַדִּיק; אַשְׁרֵי בָנָיו אַחֲרָיו.' },
  { id: 'prov-20-1', book: 'משלי', bookOrder: 28, chapter: 20, startVerse: 1, text: 'לֵץ הַיַּיִן הֹמֶה שֵׁכָר; וְכָל שֹׁגֶה בּוֹ לֹא יֶחְכָּם.' },
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
export const referenceOf = (passage: Passage) => `${passage.book} ${passage.chapter}:${passage.startVerse}${passage.endVerse ? `–${passage.endVerse}` : ''}`
