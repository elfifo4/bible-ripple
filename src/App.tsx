import { useMemo, useState } from 'react'
import type { Decision, Proposal, Ripple } from './domain'
import { editorialRules, initialProposals, passageById, passages, referenceOf, ripples } from './mockData'

type Screen = { kind: 'workspace' } | { kind: 'ripple'; rippleId: string } | { kind: 'new-proposal'; sourceId: string } | { kind: 'proposal'; proposalId: string }

const statusLabel: Record<Proposal['status'], string> = { draft: 'טיוטה', open: 'פתוחה לדיון', accepted: 'התקבלה', rejected: 'נדחתה' }
const typeOptions = ['מקבילה תוכנית', 'המשך / השלמה', 'הסבר', 'ניגוד / מתח', 'מקבילה ספרותית', 'סיפור מקביל']

function PassageCard({ id, action }: { id: string; action?: React.ReactNode }) {
  const passage = passageById(id)
  return <article className="passage-card">
    <div className="card-heading"><strong>{referenceOf(passage)}</strong>{action}</div>
    <p>{passage.text}</p>
  </article>
}

function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'workspace' })
  const [book, setBook] = useState('בראשית')
  const [chapter, setChapter] = useState(6)
  const [selectedId, setSelectedId] = useState('gen-6-9')
  const [proposals, setProposals] = useState(initialProposals)

  const navigateToPassage = (id: string) => {
    const passage = passageById(id)
    setBook(passage.book)
    setChapter(passage.chapter)
    setSelectedId(id)
    setScreen({ kind: 'workspace' })
  }

  const content = screen.kind === 'workspace'
    ? <Workspace book={book} chapter={chapter} selectedId={selectedId} proposals={proposals} onBook={setBook} onChapter={setChapter} onSelect={setSelectedId} onRipple={(rippleId) => setScreen({ kind: 'ripple', rippleId })} onProposal={(proposalId) => setScreen({ kind: 'proposal', proposalId })} onNew={() => setScreen({ kind: 'new-proposal', sourceId: selectedId })} />
    : screen.kind === 'ripple'
      ? <RippleView ripple={ripples.find((ripple) => ripple.id === screen.rippleId)!} onBack={() => setScreen({ kind: 'workspace' })} onNavigate={navigateToPassage} />
      : screen.kind === 'new-proposal'
        ? <NewProposal sourceId={screen.sourceId} onCancel={() => setScreen({ kind: 'workspace' })} onSave={(proposal) => { setProposals((current) => [proposal, ...current]); setScreen({ kind: 'proposal', proposalId: proposal.id }) }} />
        : <ProposalView proposal={proposals.find((proposal) => proposal.id === screen.proposalId)!} onBack={() => setScreen({ kind: 'workspace' })} onUpdate={(updated) => setProposals((current) => current.map((proposal) => proposal.id === updated.id ? updated : proposal))} />

  return <>
    <header className="app-header">
      <button className="brand" onClick={() => setScreen({ kind: 'workspace' })}>אדוות התנ״ך <small>מרחב עריכה</small></button>
      <nav aria-label="ניווט ראשי">
        <button className={screen.kind === 'workspace' ? 'active' : ''} onClick={() => setScreen({ kind: 'workspace' })}>תנ״ך</button>
        <button onClick={() => setScreen({ kind: 'proposal', proposalId: proposals.find((p) => p.status === 'open')?.id ?? proposals[0].id })}>הצעות <span className="count">{proposals.filter((p) => p.status === 'open').length}</span></button>
      </nav>
      <span className="user">עורכת: יעל</span>
    </header>
    <main>{content}</main>
  </>
}

type WorkspaceProps = {
  book: string; chapter: number; selectedId: string; proposals: Proposal[]
  onBook: (value: string) => void; onChapter: (value: number) => void; onSelect: (id: string) => void
  onRipple: (id: string) => void; onProposal: (id: string) => void; onNew: () => void
}

function Workspace({ book, chapter, selectedId, proposals, onBook, onChapter, onSelect, onRipple, onProposal, onNew }: WorkspaceProps) {
  const availableBooks = [...new Set(passages.map((passage) => passage.book))]
  const availableChapters = [...new Set(passages.filter((passage) => passage.book === book).map((passage) => passage.chapter))]
  const chapterPassages = passages.filter((passage) => passage.book === book && passage.chapter === chapter && !passage.endVerse)
  const selected = passageById(selectedId)
  const relatedRipples = ripples.filter((ripple) => ripple.members.some((member) => member.passageId === selectedId))
  const relatedProposals = proposals.filter((proposal) => proposal.passageIds.includes(selectedId))

  return <div className="workspace">
    <section className="reader" aria-labelledby="chapter-title">
      <div className="toolbar">
        <label>ספר<select value={book} onChange={(event) => { const nextBook = event.target.value; const first = passages.find((p) => p.book === nextBook)!; onBook(nextBook); onChapter(first.chapter); onSelect(first.id) }}>{availableBooks.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>פרק<select value={chapter} onChange={(event) => { const next = Number(event.target.value); onChapter(next); onSelect(passages.find((p) => p.book === book && p.chapter === next)!.id) }}>{availableChapters.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="chapter-heading"><div><span className="eyebrow">קריאה בהקשר</span><h1 id="chapter-title">{book} פרק {chapter}</h1></div><span className="hint">בחרו פסוק כדי לראות אדוות</span></div>
      <div className="chapter-text">
        {chapterPassages.map((passage) => {
          const rippleCount = ripples.filter((ripple) => ripple.members.some((member) => member.passageId === passage.id)).length
          return <button key={passage.id} className={`verse ${selectedId === passage.id ? 'selected' : ''}`} onClick={() => onSelect(passage.id)} aria-pressed={selectedId === passage.id}>
            <sup>{passage.startVerse}</sup> {passage.text} {rippleCount > 0 && <span className="ripple-marker" aria-label={`${rippleCount} אדוות`}>{rippleCount}</span>}
          </button>
        })}
      </div>
    </section>
    <aside className="side-panel" aria-labelledby="selection-title">
      <span className="eyebrow">הפסוק הנבחר</span>
      <h2 id="selection-title">{referenceOf(selected)}</h2>
      <p className="selected-text">{selected.text}</p>
      <button className="primary full" onClick={onNew}>+ הצעת אדווה</button>
      <section className="panel-section"><div className="section-title"><h3>אדוות מאושרות</h3><span>{relatedRipples.length}</span></div>
        {relatedRipples.length ? relatedRipples.map((ripple) => <button className="list-card" key={ripple.id} onClick={() => onRipple(ripple.id)}><small>{ripple.type}</small><strong>{ripple.title}</strong><span>{ripple.members.length} מקורות ←</span></button>) : <p className="empty">אין אדוות מאושרות לפסוק זה.</p>}
      </section>
      <section className="panel-section"><div className="section-title"><h3>הצעות והיסטוריה</h3><span>{relatedProposals.length}</span></div>
        {relatedProposals.map((proposal) => <button className="list-card" key={proposal.id} onClick={() => onProposal(proposal.id)}><small className={`status ${proposal.status}`}>{statusLabel[proposal.status]}</small><strong>{proposal.title}</strong><span>פתיחת ההצעה ←</span></button>)}
      </section>
    </aside>
  </div>
}

function RippleView({ ripple, onBack, onNavigate }: { ripple: Ripple; onBack: () => void; onNavigate: (id: string) => void }) {
  return <div className="page narrow">
    <button className="back" onClick={onBack}>→ חזרה לפרק</button>
    <span className="eyebrow">אדווה מאושרת · {ripple.type}</span><h1>{ripple.title}</h1><p className="lead">{ripple.explanation}</p>
    <div className="section-title"><h2>מקורות משתתפים</h2><span>{ripple.members.length}</span></div>
    <div className="stack">{ripple.members.map((member) => <PassageCard key={member.passageId} id={member.passageId} action={<><span className="role">{member.role}</span><button className="link" onClick={() => onNavigate(member.passageId)}>פתיחה בהקשר</button></>} />)}</div>
  </div>
}

function NewProposal({ sourceId, onCancel, onSave }: { sourceId: string; onCancel: () => void; onSave: (proposal: Proposal) => void }) {
  const candidates = passages.filter((passage) => passage.id !== sourceId)
  const preferred = candidates.find((passage) => passage.id === 'prov-20-7')?.id ?? candidates[0].id
  const [targetId, setTargetId] = useState(preferred)
  const [type, setType] = useState(typeOptions[0])
  const [reasoning, setReasoning] = useState('')
  const source = passageById(sourceId)

  const save = (status: 'draft' | 'open') => onSave({ id: `proposal-${Date.now()}`, title: `${referenceOf(source)} ו${referenceOf(passageById(targetId))}`, proposer: 'יעל', passageIds: [sourceId, targetId], proposedType: type, reasoning: reasoning || 'טרם נוסף נימוק.', status, createdAt: new Date().toISOString(), comments: [] })
  return <div className="page form-page">
    <button className="back" onClick={onCancel}>→ ביטול וחזרה</button><span className="eyebrow">הצעה חדשה</span><h1>הצעת אדווה אפשרית</h1><p className="lead">בחרו מקור נוסף והסבירו מה הוא מאיר במקור שממנו התחלתם.</p>
    <form onSubmit={(event) => { event.preventDefault(); save('open') }}>
      <fieldset><legend>1. המקורות להשוואה</legend><PassageCard id={sourceId} action={<span className="role">מקור נוכחי</span>} />
        <label className="field">מקור נוסף<select aria-label="מקור נוסף" value={targetId} onChange={(event) => setTargetId(event.target.value)}>{candidates.map((passage) => <option key={passage.id} value={passage.id}>{referenceOf(passage)}</option>)}</select></label>
        <PassageCard id={targetId} />
      </fieldset>
      <fieldset><legend>2. מהו הקשר?</legend><label className="field">סוג אדווה מוצע<select value={type} onChange={(event) => setType(event.target.value)}>{typeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field">נימוק<textarea value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="מה המקור הנוסף מאיר, משלים או מסביר?" rows={5} /></label>
        {targetId === 'prov-20-7' && <aside className="editorial-note"><strong>שאלה עריכתית פתוחה</strong><p>טרם הוכרע מתי נכון לקשור אמרת חכמה כללית לדמות מקראית. אפשר לשלוח את המקרה לדיון; אין בכך קביעה שהקשר מאושר.</p></aside>}
      </fieldset>
      <div className="form-actions"><button type="button" onClick={() => save('draft')}>שמירת טיוטה</button><button className="primary" type="submit">שליחה לדיון</button></div>
    </form>
  </div>
}

function ProposalView({ proposal, onBack, onUpdate }: { proposal: Proposal; onBack: () => void; onUpdate: (proposal: Proposal) => void }) {
  const [comment, setComment] = useState('')
  const [decisionMode, setDecisionMode] = useState<Decision['outcome'] | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const referencedRules = useMemo(() => editorialRules.filter((rule) => proposal.decision?.ruleIds?.includes(rule.id)), [proposal])
  const addComment = () => { if (!comment.trim()) return; onUpdate({ ...proposal, comments: [...proposal.comments, { id: `comment-${Date.now()}`, author: 'יעל', body: comment.trim(), createdAt: new Date().toISOString() }] }); setComment('') }
  const decide = () => {
    if (!decisionMode || !decisionReason.trim()) return
    onUpdate({ ...proposal, status: decisionMode, decision: { outcome: decisionMode, editor: 'העורך הראשי', reasoning: decisionReason.trim(), decidedAt: new Date().toISOString(), ruleIds: decisionMode === 'rejected' ? ['peshat'] : undefined } })
    setDecisionMode(null); setDecisionReason('')
  }
  return <div className="page proposal-page">
    <button className="back" onClick={onBack}>→ חזרה למרחב התנ״ך</button>
    <div className="proposal-heading"><div><span className="eyebrow">הצעה · {proposal.proposedType}</span><h1>{proposal.title}</h1></div><span className={`status large ${proposal.status}`}>{statusLabel[proposal.status]}</span></div>
    <p className="meta">הוצעה על־ידי {proposal.proposer} · {new Date(proposal.createdAt).toLocaleDateString('he-IL')}</p>
    <section><h2>המקורות המוצעים</h2><div className="comparison">{proposal.passageIds.map((id) => <PassageCard key={id} id={id} />)}</div></section>
    <section className="reason"><h2>נימוק ההצעה</h2><p>{proposal.reasoning}</p></section>
    {proposal.decision && <section className={`decision ${proposal.decision.outcome}`}><span className="eyebrow">החלטה שנשמרה</span><h2>{proposal.decision.outcome === 'accepted' ? 'ההצעה התקבלה' : 'ההצעה נדחתה'}</h2><p>{proposal.decision.reasoning}</p><small>{proposal.decision.editor} · {new Date(proposal.decision.decidedAt).toLocaleDateString('he-IL')}</small>{referencedRules.map((rule) => <p className="rule-ref" key={rule.id}>כלל קשור: {rule.title}</p>)}</section>}
    <section><div className="section-title"><h2>דיון עריכתי</h2><span>{proposal.comments.length}</span></div><ol className="discussion">{proposal.comments.map((item) => <li key={item.id}><strong>{item.author}</strong><time>{new Date(item.createdAt).toLocaleString('he-IL')}</time><p>{item.body}</p></li>)}</ol>
      {proposal.status === 'open' && <div className="comment-box"><label className="field">הוספת תגובה<textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} /></label><button onClick={addComment}>הוספת תגובה</button></div>}
    </section>
    {proposal.status === 'open' && <section className="editor-actions"><h2>החלטת העורך הראשי</h2>{!decisionMode ? <div className="button-row"><button className="accept" onClick={() => setDecisionMode('accepted')}>קבלת ההצעה</button><button className="reject" onClick={() => setDecisionMode('rejected')}>דחיית ההצעה</button></div> : <div className="decision-form"><label className="field">נימוק {decisionMode === 'accepted' ? 'לקבלה' : 'לדחייה'}<textarea autoFocus rows={3} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} /></label><div className="button-row"><button onClick={() => setDecisionMode(null)}>ביטול</button><button className={decisionMode === 'accepted' ? 'accept' : 'reject'} disabled={!decisionReason.trim()} onClick={decide}>שמירת החלטה</button></div></div>}</section>}
  </div>
}

export default App
