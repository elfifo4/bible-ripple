export type Passage = {
  id: string
  book: string
  bookOrder: number
  chapter: number
  startVerse: number
  endVerse?: number
  text: string
}

export type RippleMember = {
  passageId: Passage['id']
  role?: string
  clarification?: string
}

export type Ripple = {
  id: string
  title: string
  type: string
  explanation?: string
  anchorPassageId?: Passage['id']
  members: RippleMember[]
  status: 'approved'
}

export type EditorialRule = {
  id: string
  title: string
  statement: string
  status: 'established' | 'emerging'
}

export type DiscussionComment = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type Decision = {
  outcome: 'accepted' | 'rejected'
  editor: string
  reasoning: string
  decidedAt: string
  ruleIds?: EditorialRule['id'][]
}

export type Proposal = {
  id: string
  title: string
  proposer: string
  passageIds: Passage['id'][]
  proposedType: string
  reasoning: string
  status: 'draft' | 'open' | 'accepted' | 'rejected'
  createdAt: string
  comments: DiscussionComment[]
  decision?: Decision
}
