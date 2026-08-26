import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { MockBibleTextProvider } from './bibleTextProvider'
import type { Proposal, Ripple } from './domain'

const creationRipple: Ripple = {
  id: 'creation',
  title: 'בריאת שמים וארץ',
  type: 'מקבילה תוכנית',
  anchorPassageId: 'gen-1-1',
  status: 'approved',
  members: [
    { passageId: 'gen-1-1', role: 'עוגן' },
    { passageId: 'isa-45-12', role: 'מקבילה' },
    { passageId: 'ps-33-6', role: 'מקבילה' },
  ],
}

const acceptedProposal: Proposal = {
  id: 'accepted-example',
  title: 'בראשית ו:ט ומשלי כ:ז',
  proposer: 'ירעם נתניהו',
  passageIds: ['gen-6-9', 'prov-20-7'],
  proposedType: 'מקבילה תוכנית',
  reasoning: 'הנימוק המקורי.',
  status: 'accepted',
  createdAt: '2026-08-20T10:00:00.000Z',
  comments: [],
  decision: {
    outcome: 'accepted',
    editor: 'אלעד פיניש',
    reasoning: 'הקשר מאיר את תיאורו של נח.',
    decidedAt: '2026-08-21T10:00:00.000Z',
  },
}

describe('critical editorial workflow', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'))

  it('starts a proposal from Genesis 6:9 to Proverbs 20:7', () => {
    render(<App
      textProvider={new MockBibleTextProvider()}
      currentUserName="בודק"
      ripplesData={[]}
      initialProposals={[]}
      editorialRulesData={[]}
      onSaveProposal={vi.fn().mockResolvedValue(undefined)}
    />)
    expect(screen.getByRole('heading', { name: 'בראשית פרק ו' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ הצעת אדווה' }))
    expect(screen.getByRole('combobox', { name: 'מקור נוסף' })).toHaveValue('prov-20-7')
    expect(screen.getAllByText('משלי כ:ז')).toHaveLength(2)
    fireEvent.change(screen.getByPlaceholderText('מה המקור הנוסף מאיר, משלים או מסביר?'), { target: { value: 'דמיון בין צדיק, תום והליכה.' } })
    fireEvent.click(screen.getByRole('button', { name: 'שליחה לדיון' }))
    expect(screen.getByText('פתוחה לדיון')).toBeInTheDocument()
    expect(screen.getByText('דמיון בין צדיק, תום והליכה.')).toBeInTheDocument()
  })

  it('shows user identity separately from the sign-out action', () => {
    const onSignOut = vi.fn()
    render(<App
      textProvider={new MockBibleTextProvider()}
      currentUserName="Elad Finish"
      currentUserPhotoUrl="https://example.com/avatar.jpg"
      ripplesData={[]}
      initialProposals={[]}
      editorialRulesData={[]}
      onSaveProposal={vi.fn().mockResolvedValue(undefined)}
      onSignOut={onSignOut}
    />)

    expect(screen.getByText('עורך: Elad Finish')).toBeInTheDocument()
    expect(screen.getByAltText('תמונת הפרופיל של Elad Finish')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'יציאה' }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('distinguishes the anchor, related sources, and browser navigation', async () => {
    window.history.replaceState(null, '', '/read/Genesis/1/1')
    render(<App
      textProvider={new MockBibleTextProvider()}
      currentUserName="בודק"
      ripplesData={[creationRipple]}
      initialProposals={[]}
      editorialRulesData={[]}
      onSaveProposal={vi.fn().mockResolvedValue(undefined)}
    />)

    expect(await screen.findByLabelText('אדווה אחת · 2 מקורות נוספים')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /בריאת שמים וארץ/ }))
    expect(window.location.pathname).toBe('/ripples/creation')
    expect(screen.getByRole('heading', { name: 'בראשית א:א' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'פסוק העוגן' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'מקורות מקבילים' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'הצגה בתוך הפרק' })).toHaveLength(3)

    fireEvent.click(screen.getAllByRole('button', { name: 'הצגה בתוך הפרק' })[1])
    expect(window.location.pathname).toBe('/read/Isaiah/45/12')
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: /חזרה לאדווה/ }))
    expect(historyBack).toHaveBeenCalledOnce()
  })

  it('edits the reasoning of an accepted proposal and preserves the previous text', () => {
    window.history.replaceState(null, '', '/proposals/accepted-example')
    const onSaveProposal = vi.fn().mockResolvedValue(undefined)
    render(<App
      textProvider={new MockBibleTextProvider()}
      currentUserName="בודק"
      ripplesData={[]}
      initialProposals={[acceptedProposal]}
      editorialRulesData={[]}
      onSaveProposal={onSaveProposal}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'עריכת הנימוק' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'נימוק מעודכן' }), { target: { value: 'נימוק מעודכן ומדויק יותר.' } })
    fireEvent.click(screen.getByRole('button', { name: 'שמירת הנימוק' }))

    expect(screen.getByText('נימוק מעודכן ומדויק יותר.')).toBeInTheDocument()
    expect(screen.getByText('נוסח קודם: הנימוק המקורי.')).toBeInTheDocument()
    expect(onSaveProposal).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted', reasoning: 'נימוק מעודכן ומדויק יותר.' }))
  })

  it('reopens an accepted proposal and archives the acceptance decision', () => {
    window.history.replaceState(null, '', '/proposals/accepted-example')
    const onSaveProposal = vi.fn().mockResolvedValue(undefined)
    render(<App
      textProvider={new MockBibleTextProvider()}
      currentUserName="בודק"
      ripplesData={[]}
      initialProposals={[acceptedProposal]}
      editorialRulesData={[]}
      onSaveProposal={onSaveProposal}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'החזרה לדיון' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'סיבת ההחזרה לדיון' }), { target: { value: 'נדרש בירור עריכתי נוסף.' } })
    fireEvent.click(screen.getByRole('button', { name: 'החזרה ל־pending' }))

    expect(screen.getByText('פתוחה לדיון')).toBeInTheDocument()
    expect(screen.getByText('סיבת ההחזרה: נדרש בירור עריכתי נוסף.')).toBeInTheDocument()
    expect(screen.getByText(/החלטה קודמת: ההצעה התקבלה/)).toBeInTheDocument()
    const savedProposal = onSaveProposal.mock.calls[0][0] as Proposal
    expect(savedProposal.status).toBe('open')
    expect(savedProposal).not.toHaveProperty('decision')
    expect(savedProposal.history?.[0]).toEqual(expect.objectContaining({ kind: 'reopened', previousDecision: acceptedProposal.decision }))
  })
})
