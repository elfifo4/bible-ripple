# Bible Ripple — Product Vision

## Background

"אדוות התנ״ך" is an editorial project that collects meaningful connections between passages throughout Tanakh.

The project began as a document containing biblical verses and related passages, but its structure naturally suggests a connected knowledge system rather than a linear document.

Bible Ripple is the software system for managing that knowledge.

## Product vision

Bible Ripple should become a map of the Bible through the Bible.

A reader should eventually be able to move naturally from one biblical passage to related passages throughout Tanakh and understand how ideas, stories, expressions and events echo across different books.

However, the first product is NOT the public Bible reader.

The first product is the editorial workspace used to build and curate this network.

## Primary users

### Chief editor

Controls editorial policy and can approve or reject proposed ripples.

Initially this role belongs to the project's creator.

### Editor

A trusted contributor with strong biblical knowledge.

Editors can:
- browse biblical text;
- inspect existing ripples;
- propose new ripples;
- participate in discussions;
- suggest changes.

### Contributor

Future role.

Can submit suggestions but cannot publish them.

### Reader

Future public role.

Can browse approved content only.

## Core workflow

The central workflow is:

1. Read a biblical chapter.
2. Select a verse or passage.
3. View approved ripples involving that passage.
4. Inspect the sources participating in a ripple.
5. Propose a new source or a new ripple.
6. Discuss the proposal.
7. Approve or reject it.
8. Preserve the discussion and decision permanently.

The system should preserve not only accepted knowledge, but also the reasoning behind rejected suggestions.

## Product principle

The system should feel like a digital Beit Midrash, not like a CMS.

Discussion, evidence, disagreement and editorial decisions are part of the knowledge being created.

## Navigation

Reading should preserve biblical context.

The default Bible view should show an entire chapter rather than isolated verse cards.

Selecting a verse should reveal its ripples without losing the surrounding chapter.

Sources inside a ripple should be navigable.

Following a source should move the reader to that location in Tanakh while preserving enough context to understand how they arrived there.

## Progressive complexity

The project's domain is not fully understood yet.

Do not encode unresolved editorial decisions as hard architectural constraints.

Prefer flexible models and simple interfaces.

Build the smallest prototype that lets real editors test the workflow.

## Future possibilities — NOT MVP commitments

Potential future capabilities include:

- public Bible reader;
- public ripple suggestions;
- people and genealogy layers;
- geographical/place layers;
- prophecy/fulfillment views;
- filters by ripple type;
- visual graph exploration;
- ripple hierarchies;
- commentary integrations;
- AI-assisted discovery of candidate ripples;
- full-text biblical search.

These should not drive the initial implementation.
