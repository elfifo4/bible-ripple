import { useEffect, useMemo, useState } from 'react'
import type { BibleChapter, BiblePassage, Decision, EditorialRule, Proposal, Ripple } from './domain'
import { liveBibleTextProvider, sefariaPageUrl, type BibleTextProvider } from './bibleTextProvider'
import { ensureSingleVersePassage, passageById, passages, passageStartVerse, passagesOverlap, referenceOf } from './mockData'
import { toHebrewNumeral } from './hebrewNumerals'
import { tanakhBook, tanakhBooks } from './tanakhMetadata'
import { compareEditorAccess, type AccessRole, type EditorAccess } from './editorialRepository'

type Screen = { kind: 'workspace' } | { kind: 'ripple'; rippleId: string } | { kind: 'new-proposal'; sourceId: string } | { kind: 'proposal'; proposalId: string } | { kind: 'admin' }

type Route = { screen: Screen; passageId?: string }

const defaultPassageId = 'gen-6-9'
const passagePath = (id: string) => {
  const passage = passageById(id)
  return `/read/${passage.book}/${passage.chapter}/${passageStartVerse(passage)}`
}

const routeFromPath = (pathname: string): Route => {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (parts[0] === 'read' && parts.length >= 4) {
    const metadata = tanakhBook(parts[1]); const chapter = Number(parts[2]); const verse = Number(parts[3])
    const passage = metadata && chapter >= 1 && chapter <= metadata.chapters && verse >= 1 ? ensureSingleVersePassage(metadata.book, chapter, verse) : undefined
    if (passage) return { screen: { kind: 'workspace' }, passageId: passage.id }
  }
  if (parts[0] === 'ripples' && parts[1]) return { screen: { kind: 'ripple', rippleId: parts[1] } }
  if (parts[0] === 'proposals' && parts[1] === 'new') {
    const sourceId = new URLSearchParams(window.location.search).get('source')
    if (sourceId && passages.some((item) => item.id === sourceId)) return { screen: { kind: 'new-proposal', sourceId } }
  }
  if (parts[0] === 'proposals' && parts[1]) return { screen: { kind: 'proposal', proposalId: parts[1] } }
  if (parts[0] === 'admin') return { screen: { kind: 'admin' } }
  return { screen: { kind: 'workspace' }, passageId: defaultPassageId }
}

const statusLabel: Record<Proposal['status'], string> = { draft: 'טיוטה', open: 'פתוחה לדיון', accepted: 'התקבלה', rejected: 'נדחתה' }
const typeOptions = ['מקבילה תוכנית', 'המשך / השלמה', 'הסבר', 'ניגוד / מתח', 'מקבילה ספרותית', 'סיפור מקביל']

const rippleIncludesPassage = (ripple: Ripple, passageId: string) => ripple.members.some((member) => passagesOverlap(member.passageId, passageId))

function usePassageText(id: string, provider: BibleTextProvider) {
  const [passage, setPassage] = useState<BiblePassage | null>(null)
  useEffect(() => { let active = true; provider.getPassage(passageById(id)).then((result) => { if (active) setPassage(result) }); return () => { active = false } }, [id, provider])
  return passage
}

function PassageCard({ id, action, provider }: { id: string; action?: React.ReactNode; provider: BibleTextProvider }) {
  const passage = passageById(id)
  const biblePassage = usePassageText(id, provider)
  return <article className="passage-card">
    <div className="card-heading"><strong>{referenceOf(passage)}</strong><div className="card-actions">{action}<a className="link sefaria-link" href={sefariaPageUrl(passage)} target="_blank" rel="noopener noreferrer" aria-label={`פתיחת ${referenceOf(passage)} בספריא`}>פתיחה בספריא ↗</a></div></div>
    <p>{biblePassage?.text ?? 'טוען טקסט מספריא…'}</p>
  </article>
}

type AppProps = {
  textProvider?: BibleTextProvider
  currentUserName: string
  currentUserPhotoUrl?: string | null
  ripplesData: Ripple[]
  initialProposals: Proposal[]
  editorialRulesData: EditorialRule[]
  currentUserRole?: AccessRole
  initialAuthorizedUsers?: EditorAccess[]
  onAddAuthorizedUser?: (email: string) => Promise<EditorAccess>
  onRemoveAuthorizedUser?: (email: string) => Promise<void>
  onSaveProposal: (proposal: Proposal) => Promise<void>
  onSaveRippleTitle?: (rippleId: string, title: string) => Promise<void>
  onSignOut?: () => void
}

function App({ textProvider = liveBibleTextProvider, currentUserName, currentUserPhotoUrl, ripplesData, initialProposals, editorialRulesData, currentUserRole = 'editor', initialAuthorizedUsers = [], onAddAuthorizedUser, onRemoveAuthorizedUser, onSaveProposal, onSaveRippleTitle, onSignOut }: AppProps) {
  const initialRoute = routeFromPath(window.location.pathname)
  const initialPassage = passageById(initialRoute.passageId ?? defaultPassageId)
  const [screen, setScreen] = useState<Screen>(initialRoute.screen)
  const [book, setBook] = useState(initialPassage.book)
  const [chapter, setChapter] = useState(initialPassage.chapter)
  const [selectedId, setSelectedId] = useState(initialPassage.id)
  const [returnLabel, setReturnLabel] = useState<string | null>(() => window.history.state?.returnLabel ?? null)
  const [proposals, setProposals] = useState(initialProposals)
  const [ripples, setRipples] = useState(ripplesData)
  const [authorizedUsers, setAuthorizedUsers] = useState(initialAuthorizedUsers)

  const applyRoute = (route: Route, nextReturnLabel: string | null = null) => {
    if (route.passageId) {
      const passage = passageById(route.passageId)
      setBook(passage.book)
      setChapter(passage.chapter)
      setSelectedId(passage.id)
    }
    setReturnLabel(nextReturnLabel)
    setScreen(route.screen)
  }

  useEffect(() => {
    if (window.location.pathname === '/') window.history.replaceState({ bibleRipple: true }, '', passagePath(defaultPassageId))
    const onPopState = (event: PopStateEvent) => applyRoute(routeFromPath(window.location.pathname), event.state?.returnLabel ?? null)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const pushRoute = (path: string, route: Route, nextReturnLabel: string | null = null) => {
    window.history.pushState({ bibleRipple: true, returnLabel: nextReturnLabel }, '', path)
    applyRoute(route, nextReturnLabel)
  }

  const navigateToPassage = (id: string, nextReturnLabel: string | null = null) => {
    pushRoute(passagePath(id), { screen: { kind: 'workspace' }, passageId: id }, nextReturnLabel)
  }

  const openRipple = (rippleId: string) => pushRoute(`/ripples/${encodeURIComponent(rippleId)}`, { screen: { kind: 'ripple', rippleId } })
  const openProposal = (proposalId: string) => pushRoute(`/proposals/${encodeURIComponent(proposalId)}`, { screen: { kind: 'proposal', proposalId } })
  const openNewProposal = () => pushRoute(`/proposals/new?source=${encodeURIComponent(selectedId)}`, { screen: { kind: 'new-proposal', sourceId: selectedId } })
  const openAdmin = () => pushRoute('/admin', { screen: { kind: 'admin' } })
  const goBack = (fallbackPassageId: string) => {
    if (window.history.state?.bibleRipple) window.history.back()
    else navigateToPassage(fallbackPassageId)
  }
  const saveRippleTitleFor = onSaveRippleTitle ? async (rippleId: string, title: string) => { await onSaveRippleTitle(rippleId, title); setRipples((current) => current.map((item) => item.id === rippleId ? { ...item, title } : item)) } : undefined

  const activeRipple = screen.kind === 'ripple' ? ripples.find((ripple) => ripple.id === screen.rippleId) : undefined
  const activeProposal = screen.kind === 'proposal' ? proposals.find((proposal) => proposal.id === screen.proposalId) : undefined

  const content = screen.kind === 'admin' && currentUserRole === 'admin' && onAddAuthorizedUser && onRemoveAuthorizedUser
    ? <AdminView users={[...authorizedUsers].sort(compareEditorAccess)} onBack={() => goBack(selectedId)} onAdd={async (email) => { const added = await onAddAuthorizedUser(email); setAuthorizedUsers((current) => [...current.filter((item) => item.email !== added.email), added].sort(compareEditorAccess)) }} onRemove={async (email) => { await onRemoveAuthorizedUser(email); setAuthorizedUsers((current) => current.filter((item) => item.email !== email)) }} />
    : screen.kind === 'workspace'
    ? <Workspace provider={textProvider} book={book} chapter={chapter} selectedId={selectedId} proposals={proposals} ripples={ripples} returnLabel={returnLabel} onReturn={() => window.history.back()} onSelect={navigateToPassage} onRipple={openRipple} onProposal={openProposal} onNew={openNewProposal} onSaveRippleTitle={saveRippleTitleFor} />
    : screen.kind === 'ripple' && activeRipple
      ? <RippleView provider={textProvider} ripple={activeRipple} onBack={() => goBack(activeRipple.anchorPassageId ?? activeRipple.members[0].passageId)} onNavigate={(id) => navigateToPassage(id, 'חזרה לאדווה')} onSaveTitle={saveRippleTitleFor ? (title) => saveRippleTitleFor(activeRipple.id, title) : undefined} />
      : screen.kind === 'new-proposal'
        ? <NewProposal provider={textProvider} sourceId={screen.sourceId} proposer={currentUserName} onCancel={() => goBack(screen.sourceId)} onSave={(proposal) => { setProposals((current) => [proposal, ...current]); void onSaveProposal(proposal); openProposal(proposal.id) }} />
        : activeProposal
          ? <ProposalView provider={textProvider} proposal={activeProposal} currentUserName={currentUserName} editorialRules={editorialRulesData} onBack={() => goBack(activeProposal.passageIds[0])} onUpdate={(updated) => { setProposals((current) => current.map((proposal) => proposal.id === updated.id ? updated : proposal)); void onSaveProposal(updated) }} />
          : <NotFound onBack={() => navigateToPassage(selectedId)} />

  return <>
    <header className="app-header">
      <button className="brand" onClick={() => navigateToPassage(selectedId)}><img src={`${import.meta.env.BASE_URL}icon-256.png`} alt="" /> <span>אדוות התנ״ך <small>ממשק עורכים</small></span></button>
      <nav aria-label="ניווט ראשי">
        <button className={screen.kind === 'workspace' ? 'active' : ''} onClick={() => navigateToPassage(selectedId)}>תנ״ך</button>
        <button disabled={!proposals.length} onClick={() => { const proposal = proposals.find((item) => item.status === 'open') ?? proposals[0]; if (proposal) openProposal(proposal.id) }}>הצעות <span className="count">{proposals.filter((p) => p.status === 'open').length}</span></button>
        {currentUserRole === 'admin' && <button className={screen.kind === 'admin' ? 'active' : ''} onClick={openAdmin}>ניהול</button>}
      </nav>
      <div className="user-menu">
        <div className="user-profile">
          {currentUserPhotoUrl
            ? <img className="user-avatar" src={currentUserPhotoUrl} alt={`תמונת הפרופיל של ${currentUserName}`} referrerPolicy="no-referrer" />
            : <span className="user-avatar user-initial" aria-hidden="true">{currentUserName.charAt(0)}</span>}
          <span className="user-name">עורך: {currentUserName}</span>
        </div>
        {onSignOut && <button className="sign-out" onClick={onSignOut}>יציאה</button>}
      </div>
    </header>
    <main>{content}</main>
  </>
}

function AdminView({ users, onBack, onAdd, onRemove }: { users: EditorAccess[]; onBack: () => void; onAdd: (email: string) => Promise<void>; onRemove: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setMessage('יש להזין כתובת אימייל תקינה.'); return }
    setBusy(true); setMessage(null)
    try { await onAdd(normalizedEmail); setEmail(''); setMessage(`${normalizedEmail} נוסף לרשימת העורכים.`) }
    catch { setMessage('לא ניתן היה להוסיף את המשתמש. ייתכן שהכתובת כבר משויכת לתפקיד מוגן.') }
    finally { setBusy(false) }
  }
  const remove = async (user: EditorAccess) => {
    if (!window.confirm(`להסיר את ${user.email} מרשימת העורכים?`)) return
    setBusy(true); setMessage(null)
    try { await onRemove(user.email); setMessage(`${user.email} הוסר מרשימת העורכים.`) }
    catch { setMessage('לא ניתן היה להסיר את המשתמש.') }
    finally { setBusy(false) }
  }
  return <div className="page narrow admin-page">
    <button className="back" onClick={onBack}>→ חזרה למרחב התנ״ך</button>
    <span className="eyebrow">ניהול הרשאות</span><h1>עורכים מורשים</h1>
    <p className="lead">רק הכתובות ברשימה יכולות להיכנס למרחב העריכה באמצעות חשבון Google מאומת.</p>
    <form className="access-form" onSubmit={(event) => void submit(event)}><label className="field">כתובת אימייל<input type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label><button className="primary" disabled={busy || !email.trim()} type="submit">הוספת עורך</button></form>
    {message && <p className="form-message" role="status">{message}</p>}
    <ul className="access-list">{users.map((user) => <li key={user.email}><div><strong dir="ltr">{user.email}</strong><span>{user.role === 'admin' ? 'מנהל' : 'עורך'}</span></div>{user.role === 'editor' && <button disabled={busy} onClick={() => void remove(user)}>הסרה</button>}</li>)}</ul>
  </div>
}

type WorkspaceProps = {
  provider: BibleTextProvider
  book: string; chapter: number; selectedId: string; proposals: Proposal[]; ripples: Ripple[]; returnLabel: string | null
  onReturn: () => void; onSelect: (id: string) => void
  onRipple: (id: string) => void; onProposal: (id: string) => void; onNew: () => void
  onSaveRippleTitle?: (rippleId: string, title: string) => Promise<void>
}

function Workspace({ provider, book, chapter, selectedId, proposals, ripples, returnLabel, onReturn, onSelect, onRipple, onProposal, onNew, onSaveRippleTitle }: WorkspaceProps) {
  const [bibleChapter, setBibleChapter] = useState<BibleChapter | null>(null)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const bookRecord = tanakhBook(book)!
  useEffect(() => { let active = true; provider.getChapter(book, bookRecord.titleHe, chapter).then((result) => { if (active) setBibleChapter(result) }); return () => { active = false } }, [book, bookRecord.titleHe, chapter, provider])
  const bookIndex = tanakhBooks.findIndex((item) => item.book === book)
  const previousBook = tanakhBooks[bookIndex - 1]
  const nextBook = tanakhBooks[bookIndex + 1]
  const navigate = (targetBook: string, targetChapter: number) => onSelect(ensureSingleVersePassage(targetBook, targetChapter).id)
  const navigatePreviousChapter = () => chapter > 1 ? navigate(book, chapter - 1) : previousBook && navigate(previousBook.book, previousBook.chapters)
  const navigateNextChapter = () => chapter < bookRecord.chapters ? navigate(book, chapter + 1) : nextBook && navigate(nextBook.book, 1)
  const selected = passageById(selectedId)
  const selectedText = bibleChapter?.verses.find((verse) => passageStartVerse(verse.ref) === passageStartVerse(selected))?.text ?? selected.fallbackText
  const relatedRipples = ripples.filter((ripple) => rippleIncludesPassage(ripple, selectedId))
  const relatedProposals = proposals.filter((proposal) => proposal.passageIds.includes(selectedId))
  const relatedSourceIds = new Set(relatedRipples.flatMap((ripple) => ripple.members.map((member) => member.passageId).filter((id) => !passagesOverlap(id, selectedId))))
  const relatedSourceCount = relatedSourceIds.size
  const rippleSummary = `${relatedRipples.length === 1 ? 'אדווה אחת' : `${relatedRipples.length} אדוות`} · ${relatedSourceCount === 1 ? 'מקור נוסף אחד' : `${relatedSourceCount} מקורות נוספים`}`

  return <div className="workspace">
    <section className="reader" aria-labelledby="chapter-title">
      {returnLabel && <button className="context-return" onClick={onReturn}>→ {returnLabel}</button>}
      <div className="toolbar">
        <label>ספר<select value={book} onChange={(event) => navigate(event.target.value, 1)}>{tanakhBooks.map((item) => <option key={item.book} value={item.book}>{item.titleHe}</option>)}</select></label>
        <label>פרק<select value={chapter} onChange={(event) => navigate(book, Number(event.target.value))}>{Array.from({ length: bookRecord.chapters }, (_, index) => index + 1).map((item) => <option key={item} value={item}>{toHebrewNumeral(item)}</option>)}</select></label>
      </div>
      <div className="chapter-heading"><div><span className="eyebrow">קריאה בהקשר</span><h1 id="chapter-title">{selected.bookTitleHe} פרק {toHebrewNumeral(chapter)}</h1></div><span className="hint">בחרו פסוק כדי לראות אדוות</span></div>
      <ChapterNavigation previousBook={previousBook?.titleHe} nextBook={nextBook?.titleHe} canPreviousChapter={Boolean(chapter > 1 || previousBook)} canNextChapter={Boolean(chapter < bookRecord.chapters || nextBook)} onPreviousBook={() => previousBook && navigate(previousBook.book, 1)} onNextBook={() => nextBook && navigate(nextBook.book, 1)} onPreviousChapter={navigatePreviousChapter} onNextChapter={navigateNextChapter} />
      <div className="chapter-text">
        {!bibleChapter && <p className="loading">טוען את הפרק מספריא…</p>}
        {bibleChapter?.verses.map((verse) => {
          const verseNumber = passageStartVerse(verse.ref)
          const knownPassage = ensureSingleVersePassage(book, chapter, verseNumber)
          const verseRipples = knownPassage ? ripples.filter((ripple) => rippleIncludesPassage(ripple, knownPassage.id)) : []
          const sourceCount = knownPassage ? new Set(verseRipples.flatMap((ripple) => ripple.members.map((member) => member.passageId).filter((id) => !passagesOverlap(id, knownPassage.id)))).size : 0
          const summary = `${verseRipples.length === 1 ? 'אדווה אחת' : `${verseRipples.length} אדוות`} · ${sourceCount === 1 ? 'מקור נוסף אחד' : `${sourceCount} מקורות נוספים`}`
          return <button key={verse.ref.canonicalRef} className={`verse ${knownPassage && selectedId === knownPassage.id ? 'selected' : ''}`} onClick={() => { if (knownPassage) { onSelect(knownPassage.id); setMobilePanelOpen(true) } }} aria-pressed={Boolean(knownPassage && selectedId === knownPassage.id)}>
            <sup>{toHebrewNumeral(verseNumber)}</sup> {verse.text} {verseRipples.length > 0 && <span className="ripple-marker" aria-label={summary}><span className="marker-desktop">{summary}</span><span className="marker-mobile">{sourceCount === 1 ? 'מקור אחד' : `${sourceCount} מקורות`}</span></span>}
          </button>
        })}
      </div>
      <ChapterNavigation previousBook={previousBook?.titleHe} nextBook={nextBook?.titleHe} canPreviousChapter={Boolean(chapter > 1 || previousBook)} canNextChapter={Boolean(chapter < bookRecord.chapters || nextBook)} onPreviousBook={() => previousBook && navigate(previousBook.book, 1)} onNextBook={() => nextBook && navigate(nextBook.book, 1)} onPreviousChapter={navigatePreviousChapter} onNextChapter={navigateNextChapter} />
      <p className="text-source">טקסט: ספריא · {bibleChapter?.source === 'sefaria' ? "Tanach with Ta'amei Hamikra · נחלת הכלל" : 'מצב מקומי זמני'}</p>
    </section>
    {mobilePanelOpen && <button className="panel-backdrop" aria-label="סגירת פאנל האדוות" onClick={() => setMobilePanelOpen(false)} />}
    <aside key={selectedId} className={`side-panel ${mobilePanelOpen ? 'mobile-open' : ''}`} aria-labelledby="selection-title" aria-live="polite">
      <button className="panel-close" aria-label="סגירת פאנל האדוות" onClick={() => setMobilePanelOpen(false)}>×</button>
      <span className="eyebrow">הפסוק הנבחר</span>
      <h2 id="selection-title">{referenceOf(selected)}</h2>
      <p className="selected-text">{selectedText}</p>
      <button className="primary full" onClick={onNew}>+ הצעת אדווה</button>
      <section className="panel-section"><div className="section-title"><h3>אדוות מאושרות</h3><span>{relatedRipples.length}</span></div>
        {relatedRipples.length ? relatedRipples.map((ripple) => {
          const anchor = passageById(ripple.anchorPassageId ?? ripple.members[0].passageId)
          const additionalSources = ripple.members.filter((member) => !passagesOverlap(member.passageId, selectedId)).length
          if (!ripple.title) return <div className="list-card untitled-card" key={ripple.id}><button className="card-open" aria-label={`פתיחת אדווה ${referenceOf(anchor)}`} onClick={() => onRipple(ripple.id)}><small>{ripple.type}</small><strong>{referenceOf(anchor)}</strong><span>{additionalSources === 1 ? 'מקור נוסף אחד' : `${additionalSources} מקורות נוספים`} ←</span></button>{onSaveRippleTitle && <SuggestedTitleEditor ripple={ripple} onSave={(title) => onSaveRippleTitle(ripple.id, title)} />}</div>
          return <button className="list-card" key={ripple.id} onClick={() => onRipple(ripple.id)}><small>{ripple.type}</small><strong>{ripple.title}</strong><span>{additionalSources === 1 ? 'מקור נוסף אחד' : `${additionalSources} מקורות נוספים`} ←</span></button>
        }) : <p className="empty">אין אדוות מאושרות לפסוק זה.</p>}
      </section>
      <section className="panel-section"><div className="section-title"><h3>הצעות והיסטוריה</h3><span>{relatedProposals.length}</span></div>
        {relatedProposals.map((proposal) => <button className="list-card" key={proposal.id} onClick={() => onProposal(proposal.id)}><small className={`status ${proposal.status}`}>{statusLabel[proposal.status]}</small><strong>{proposal.title}</strong><span>פתיחת ההצעה ←</span></button>)}
      </section>
    </aside>
    {!mobilePanelOpen && <button className="mobile-ripple-bar" onClick={() => setMobilePanelOpen(true)}><span><strong>{referenceOf(selected)}</strong> · {rippleSummary}</span><span>הצגה ↑</span></button>}
  </div>
}

function ChapterNavigation({ previousBook, nextBook, canPreviousChapter, canNextChapter, onPreviousBook, onNextBook, onPreviousChapter, onNextChapter }: { previousBook?: string; nextBook?: string; canPreviousChapter: boolean; canNextChapter: boolean; onPreviousBook: () => void; onNextBook: () => void; onPreviousChapter: () => void; onNextChapter: () => void }) {
  return <nav className="chapter-navigation" aria-label="ניווט בין ספרים ופרקים"><div><button disabled={!previousBook} onClick={onPreviousBook}>→ הספר הקודם{previousBook ? `: ${previousBook}` : ''}</button><button disabled={!nextBook} onClick={onNextBook}>הספר הבא{nextBook ? `: ${nextBook}` : ''} ←</button></div><div><button disabled={!canPreviousChapter} onClick={onPreviousChapter}>→ הפרק הקודם</button><button disabled={!canNextChapter} onClick={onNextChapter}>הפרק הבא ←</button></div></nav>
}

function RippleView({ ripple, onBack, onNavigate, onSaveTitle, provider }: { ripple: Ripple; onBack: () => void; onNavigate: (id: string) => void; onSaveTitle?: (title: string) => Promise<void>; provider: BibleTextProvider }) {
  const [title, setTitle] = useState(ripple.title ?? ripple.suggestedTitle ?? '')
  const [editing, setEditing] = useState(!ripple.title)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const anchorId = ripple.anchorPassageId ?? ripple.members[0].passageId
  const anchorMember = ripple.members.find((member) => member.passageId === anchorId)
  const relatedMembers = ripple.members.filter((member) => member.passageId !== anchorId)
  return <div className="page narrow">
    <button className="back" onClick={onBack}>→ חזרה לפרק</button>
    <span className="eyebrow">אדווה מאושרת · {ripple.type}</span>
    <h1>{referenceOf(passageById(anchorId))}</h1>
    {ripple.title ? <div className="ripple-title-row"><p className="ripple-title">{ripple.title}</p>{onSaveTitle && <button className="link" onClick={() => { setEditing(true); setMessage(null) }}>עריכת כותרת</button>}</div> : <p className="title-warning" role="status"><strong>חסרה כותרת עריכתית</strong><span>האדווה מוצגת זמנית לפי מראה המקום של העוגן.</span></p>}
    {editing && onSaveTitle && <form className="title-form" onSubmit={async (event) => { event.preventDefault(); const nextTitle = title.trim(); if (!nextTitle) { setMessage('יש להזין כותרת.'); return } setSaving(true); setMessage(null); try { await onSaveTitle(nextTitle); setEditing(false); setMessage('הכותרת נשמרה.'); } catch { setMessage('לא ניתן היה לשמור את הכותרת. נסו שוב.'); } finally { setSaving(false) } }}><label className="field">הצעה לכותרת<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} autoFocus /></label><div className="button-row"><button className="primary" type="submit" disabled={saving || !title.trim()}>{saving ? 'שומר…' : 'אישור ושמירה'}</button>{ripple.title && <button type="button" disabled={saving} onClick={() => { setTitle(ripple.title ?? ''); setEditing(false); setMessage(null) }}>ביטול</button>}</div></form>}
    {message && <p className="form-message" role="status">{message}</p>}
    {ripple.explanation && <p className="lead">{ripple.explanation}</p>}
    <section className="ripple-anchor" aria-labelledby="anchor-title">
      <div className="section-title"><h2 id="anchor-title">פסוק העוגן</h2><span className="role">{anchorMember?.role ?? 'עוגן'}</span></div>
      <PassageCard provider={provider} id={anchorId} action={<button className="link" onClick={() => onNavigate(anchorId)}>הצגה בתוך הפרק</button>} />
    </section>
    <section className="ripple-related" aria-labelledby="related-title">
      <div className="section-title"><h2 id="related-title">מקורות מקבילים</h2><span>{relatedMembers.length}</span></div>
      <div className="stack">{relatedMembers.map((member) => <PassageCard provider={provider} key={member.passageId} id={member.passageId} action={<><span className="role">{member.role}</span><button className="link" onClick={() => onNavigate(member.passageId)}>הצגה בתוך הפרק</button></>} />)}</div>
    </section>
  </div>
}

function SuggestedTitleEditor({ ripple, onSave }: { ripple: Ripple; onSave: (title: string) => Promise<void> }) {
  const [value, setValue] = useState(ripple.suggestedTitle ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  return <form className="suggested-title-form" onSubmit={async (event) => { event.preventDefault(); const title = value.trim(); if (!title) return; setSaving(true); setMessage(null); try { await onSave(title); setMessage('הכותרת נשמרה.') } catch { setMessage('השמירה נכשלה.') } finally { setSaving(false) } }}><label>הצעה לכותרת<input value={value} onChange={(event) => setValue(event.target.value)} maxLength={160} /></label><button className="primary" type="submit" disabled={saving || !value.trim()}>{saving ? 'שומר…' : 'אישור ושמירה'}</button>{message && <span role="status">{message}</span>}</form>
}

function NotFound({ onBack }: { onBack: () => void }) {
  return <div className="page narrow"><span className="eyebrow">ממשק עורכים</span><h1>העמוד לא נמצא</h1><p className="lead">ייתכן שהאדווה או ההצעה אינן זמינות עוד.</p><button className="primary" onClick={onBack}>חזרה לתנ״ך</button></div>
}

function NewProposal({ sourceId, proposer, onCancel, onSave, provider }: { sourceId: string; proposer: string; onCancel: () => void; onSave: (proposal: Proposal) => void; provider: BibleTextProvider }) {
  const candidates = passages.filter((passage) => passage.id !== sourceId)
  const preferred = candidates.find((passage) => passage.id === 'prov-20-7')?.id ?? candidates[0].id
  const [targetId, setTargetId] = useState(preferred)
  const [type, setType] = useState(typeOptions[0])
  const [reasoning, setReasoning] = useState('')
  const source = passageById(sourceId)

  const save = (status: 'draft' | 'open') => onSave({ id: `proposal-${Date.now()}`, title: `${referenceOf(source)} ו${referenceOf(passageById(targetId))}`, proposer, passageIds: [sourceId, targetId], proposedType: type, reasoning: reasoning || 'טרם נוסף נימוק.', status, createdAt: new Date().toISOString(), comments: [] })
  return <div className="page form-page">
    <button className="back" onClick={onCancel}>→ ביטול וחזרה</button><span className="eyebrow">הצעה חדשה</span><h1>הצעת אדווה אפשרית</h1><p className="lead">בחרו מקור נוסף והסבירו מה הוא מאיר במקור שממנו התחלתם.</p>
    <form onSubmit={(event) => { event.preventDefault(); save('open') }}>
      <fieldset><legend>1. המקורות להשוואה</legend><PassageCard provider={provider} id={sourceId} action={<span className="role">מקור נוכחי</span>} />
        <label className="field">מקור נוסף<select aria-label="מקור נוסף" value={targetId} onChange={(event) => setTargetId(event.target.value)}>{candidates.map((passage) => <option key={passage.id} value={passage.id}>{referenceOf(passage)}</option>)}</select></label>
        <PassageCard provider={provider} id={targetId} />
      </fieldset>
      <fieldset><legend>2. מהו הקשר?</legend><label className="field">סוג אדווה מוצע<select value={type} onChange={(event) => setType(event.target.value)}>{typeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field">נימוק<textarea value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="מה המקור הנוסף מאיר, משלים או מסביר?" rows={5} /></label>
        {targetId === 'prov-20-7' && <aside className="editorial-note"><strong>שאלה עריכתית פתוחה</strong><p>טרם הוכרע מתי נכון לקשור אמרת חכמה כללית לדמות מקראית. אפשר לשלוח את המקרה לדיון; אין בכך קביעה שהקשר מאושר.</p></aside>}
      </fieldset>
      <div className="form-actions"><button type="button" onClick={() => save('draft')}>שמירת טיוטה</button><button className="primary" type="submit">שליחה לדיון</button></div>
    </form>
  </div>
}

function ProposalView({ proposal, currentUserName, editorialRules, onBack, onUpdate, provider }: { proposal: Proposal; currentUserName: string; editorialRules: EditorialRule[]; onBack: () => void; onUpdate: (proposal: Proposal) => void; provider: BibleTextProvider }) {
  const [comment, setComment] = useState('')
  const [decisionMode, setDecisionMode] = useState<Decision['outcome'] | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [editingReasoning, setEditingReasoning] = useState(false)
  const [reasoningDraft, setReasoningDraft] = useState(proposal.reasoning)
  const [reopening, setReopening] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const referencedRules = useMemo(() => editorialRules.filter((rule) => proposal.decision?.ruleIds?.includes(rule.id)), [editorialRules, proposal])
  const addComment = () => { if (!comment.trim()) return; onUpdate({ ...proposal, comments: [...proposal.comments, { id: `comment-${Date.now()}`, author: currentUserName, body: comment.trim(), createdAt: new Date().toISOString() }] }); setComment('') }
  const decide = () => {
    if (!decisionMode || !decisionReason.trim()) return
    const decision: Decision = { outcome: decisionMode, editor: currentUserName, reasoning: decisionReason.trim(), decidedAt: new Date().toISOString() }
    if (decisionMode === 'rejected') decision.ruleIds = ['peshat']
    onUpdate({ ...proposal, status: decisionMode, decision })
    setDecisionMode(null); setDecisionReason('')
  }
  const saveReasoning = () => {
    const reasoning = reasoningDraft.trim()
    if (!reasoning || reasoning === proposal.reasoning) return
    onUpdate({
      ...proposal,
      reasoning,
      history: [...(proposal.history ?? []), { id: `history-${Date.now()}`, kind: 'reasoning-edited', editor: currentUserName, createdAt: new Date().toISOString(), previousReasoning: proposal.reasoning, reasoning }],
    })
    setEditingReasoning(false)
  }
  const reopen = () => {
    if (!proposal.decision || !reopenReason.trim()) return
    const { decision, ...proposalWithoutDecision } = proposal
    onUpdate({
      ...proposalWithoutDecision,
      status: 'open',
      history: [...(proposal.history ?? []), { id: `history-${Date.now()}`, kind: 'reopened', editor: currentUserName, createdAt: new Date().toISOString(), reasoning: reopenReason.trim(), previousDecision: decision }],
    })
    setReopening(false); setReopenReason('')
  }
  return <div className="page proposal-page">
    <button className="back" onClick={onBack}>→ חזרה למרחב התנ״ך</button>
    <div className="proposal-heading"><div><span className="eyebrow">הצעה · {proposal.proposedType}</span><h1>{proposal.title}</h1></div><span className={`status large ${proposal.status}`}>{statusLabel[proposal.status]}</span></div>
    <p className="meta">הוצעה על־ידי {proposal.proposer} · {new Date(proposal.createdAt).toLocaleDateString('he-IL')}</p>
    <section><h2>המקורות המוצעים</h2><div className="comparison">{proposal.passageIds.map((id) => <PassageCard provider={provider} key={id} id={id} />)}</div></section>
    <section className="reason"><div className="section-title"><h2>נימוק ההצעה</h2>{proposal.status === 'accepted' && !editingReasoning && <button className="link" onClick={() => { setReasoningDraft(proposal.reasoning); setEditingReasoning(true) }}>עריכת הנימוק</button>}</div>
      {editingReasoning
        ? <div className="reason-edit"><label className="field">נימוק מעודכן<textarea autoFocus rows={4} value={reasoningDraft} onChange={(event) => setReasoningDraft(event.target.value)} /></label><div className="button-row"><button onClick={() => setEditingReasoning(false)}>ביטול</button><button className="primary" disabled={!reasoningDraft.trim() || reasoningDraft.trim() === proposal.reasoning} onClick={saveReasoning}>שמירת הנימוק</button></div></div>
        : <p>{proposal.reasoning}</p>}
    </section>
    {proposal.decision && <section className={`decision ${proposal.decision.outcome}`}><span className="eyebrow">החלטה שנשמרה</span><h2>{proposal.decision.outcome === 'accepted' ? 'ההצעה התקבלה' : 'ההצעה נדחתה'}</h2><p>{proposal.decision.reasoning}</p><small>{proposal.decision.editor} · {new Date(proposal.decision.decidedAt).toLocaleDateString('he-IL')}</small>{referencedRules.map((rule) => <p className="rule-ref" key={rule.id}>כלל קשור: {rule.title}</p>)}</section>}
    <section><div className="section-title"><h2>דיון עריכתי</h2><span>{proposal.comments.length}</span></div><ol className="discussion">{proposal.comments.map((item) => <li key={item.id}><strong>{item.author}</strong><time>{new Date(item.createdAt).toLocaleString('he-IL')}</time><p>{item.body}</p></li>)}</ol>
      {proposal.status === 'open' && <div className="comment-box"><label className="field">הוספת תגובה<textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} /></label><button onClick={addComment}>הוספת תגובה</button></div>}
    </section>
    {(proposal.history?.length ?? 0) > 0 && <section><div className="section-title"><h2>היסטוריית שינויים</h2><span>{proposal.history!.length}</span></div><ol className="proposal-history">{[...proposal.history!].reverse().map((entry) => <li key={entry.id}><strong>{entry.kind === 'reasoning-edited' ? 'נימוק ההצעה נערך' : 'ההצעה הוחזרה לדיון'}</strong><time>{entry.editor} · {new Date(entry.createdAt).toLocaleString('he-IL')}</time>{entry.kind === 'reasoning-edited' ? <p>נוסח קודם: {entry.previousReasoning}</p> : <><p>סיבת ההחזרה: {entry.reasoning}</p><p>החלטה קודמת: ההצעה {entry.previousDecision.outcome === 'accepted' ? 'התקבלה' : 'נדחתה'} — {entry.previousDecision.reasoning}</p></>}</li>)}</ol></section>}
    {proposal.status === 'accepted' && <section className="editor-actions"><h2>פתיחה מחדש של ההצעה</h2>{!reopening ? <button className="reopen" onClick={() => setReopening(true)}>החזרה לדיון</button> : <div className="decision-form"><label className="field">סיבת ההחזרה לדיון<textarea autoFocus rows={3} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} /></label><p className="meta">החלטת הקבלה תישמר בהיסטוריה, וההצעה תחזור לסטטוס פתוחה לדיון.</p><div className="button-row"><button onClick={() => setReopening(false)}>ביטול</button><button className="reopen" disabled={!reopenReason.trim()} onClick={reopen}>החזרה ל־pending</button></div></div>}</section>}
    {proposal.status === 'open' && <section className="editor-actions"><h2>החלטת העורך הראשי</h2>{!decisionMode ? <div className="button-row"><button className="accept" onClick={() => setDecisionMode('accepted')}>קבלת ההצעה</button><button className="reject" onClick={() => setDecisionMode('rejected')}>דחיית ההצעה</button></div> : <div className="decision-form"><label className="field">נימוק {decisionMode === 'accepted' ? 'לקבלה' : 'לדחייה'}<textarea autoFocus rows={3} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} /></label><div className="button-row"><button onClick={() => setDecisionMode(null)}>ביטול</button><button className={decisionMode === 'accepted' ? 'accept' : 'reject'} disabled={!decisionReason.trim()} onClick={decide}>שמירת החלטה</button></div></div>}</section>}
  </div>
}

export default App
