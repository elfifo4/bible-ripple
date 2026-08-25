import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { MockBibleTextProvider } from './bibleTextProvider'

describe('critical editorial workflow', () => {
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
})
