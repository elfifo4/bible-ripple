# Bible Ripple — MVP

## Goal

Validate whether Bible Ripple provides a better editorial workflow than the current document-based process.

The MVP is successful if editors prefer using it to manage ripples, suggestions and discussions.

It does NOT need to be a complete Bible platform.

---

# Primary scenario

An editor should be able to:

1. open a biblical chapter;
2. read the chapter in context;
3. select a verse;
4. see approved Ripples involving that verse;
5. open a Ripple;
6. inspect its related passages;
7. navigate to one of those passages;
8. propose a new Ripple;
9. explain the proposal;
10. participate in discussion;
11. accept or reject the proposal;
12. retain the proposal and discussion after rejection.

---

# Prototype screens

## 1. Bible workspace

Display:

- book selector;
- chapter selector;
- full chapter;
- verse numbers;
- selected verse;
- number of Ripples associated with relevant verses;
- side panel for selected passage.

The UI must be Hebrew-first and RTL.

---

## 2. Ripple view

Display:

- Ripple title;
- Ripple type;
- primary/anchor passage;
- participating passages;
- role of each passage where useful;
- short editorial explanation where present.

Every source should be navigable.

---

## 3. New proposal

Allow an editor to:

- start from the current passage;
- search/select another passage;
- optionally add more passages;
- select a proposed RippleType;
- write reasoning;
- save draft;
- submit for discussion.

Editors should select biblical references rather than manually copy biblical text.

---

## 4. Proposal / discussion

Display compared passages clearly.

Display:

- proposer;
- reasoning;
- chronological discussion;
- proposal status;
- accept/reject actions for authorized editors.

Rejecting a proposal should allow/require a short reason.

Rejected proposals remain accessible.

---

# Mock-data prototype

The first implementation should NOT require a backend.

Use local mock data.

Suggested content:

- selected examples from Genesis 1;
- Noah example;
- Abraham's servant narrative;
- several approved Ripples;
- several open Proposals;
- at least one rejected Proposal;
- several EditorialRules.

The goal is UX validation.

---

# Explicitly out of scope for prototype

Do NOT implement yet:

- Firebase;
- database;
- authentication;
- public submissions;
- AI-generated Ripple suggestions;
- maps;
- genealogy trees;
- graph visualization;
- advanced permissions;
- notifications;
- comments from anonymous users;
- complete Tanakh import;
- complex chapter-review workflows;
- mobile applications.

---

# Technical direction for prototype

Preferred initial stack:

- React;
- TypeScript;
- Vite;
- static mock data;
- GitHub Pages.

Keep architecture simple.

Avoid introducing a backend abstraction merely because one may be needed later.

The prototype should be deployable as a static site.

---

# UX principle

Do not optimize for visual polish yet.

Optimize for whether a biblical editor can understand the workflow without instruction.

A useful usability test is:

"Open Genesis 6:9 and propose Proverbs 20:7 as a possible Ripple."

Observe whether the editor can complete the task without assistance.
