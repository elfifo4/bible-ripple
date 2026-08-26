export type ContiguousPassageSelection = {
  kind: 'range'
  startVerse: number
  endVerse?: number
}

export type DiscretePassageSelection = {
  kind: 'verses'
  verses: [number, ...number[]]
}

export type PassageSelection = ContiguousPassageSelection | DiscretePassageSelection

export type PassageRef = {
  id: string
  canonicalRef: string
  book: string
  bookTitleHe: string
  bookOrder: number
  chapter: number
  selection: PassageSelection
}

export type Passage = PassageRef

export type BiblePassage = {
  ref: PassageRef
  text: string
  source: 'sefaria' | 'mock'
  versionTitle: string
  license: string
}

export type BibleChapter = {
  book: string
  bookTitleHe: string
  chapter: number
  verses: BiblePassage[]
  source: BiblePassage['source']
}

export type RippleMember = {
  passageId: Passage['id']
  role?: string
  clarification?: string
}

export type Ripple = {
  id: string
  title?: string
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

export type ProposalHistoryEntry =
  | {
    id: string
    kind: 'reasoning-edited'
    editor: string
    createdAt: string
    previousReasoning: string
    reasoning: string
  }
  | {
    id: string
    kind: 'reopened'
    editor: string
    createdAt: string
    reasoning: string
    previousDecision: Decision
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
  history?: ProposalHistoryEntry[]
}
