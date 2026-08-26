import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { MockBibleTextProvider } from './bibleTextProvider'
import type { Ripple } from './domain'

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
})
