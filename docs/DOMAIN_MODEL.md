# Bible Ripple — Domain Model

This document describes the conceptual model.

It is intentionally not a database schema yet.

The implementation may evolve as we test the product.

---

## Passage

A reference to a contiguous unit of biblical text.

A Passage identifies a biblical location; it does not own a permanent copy of the biblical text. The current prototype stores a normalized Sefaria-style canonical reference and separate Hebrew display metadata. Text, edition and license metadata are supplied through a Bible text provider. This keeps editorial relationships stable if the selected textual edition changes.

A Passage may represent:

- one verse;
- multiple consecutive verses;
- a discrete collection of verses from one chapter;
- a larger narrative section.

Do NOT model the domain around verses only.

Examples:

Genesis 1:1

Genesis 24:1-27

Genesis 24:34-48

Psalms 104:2,5

### Passage selection

A Passage uses a closed, discriminated selection type:

- `range` — one verse or a contiguous range;
- `verses` — a non-empty, discrete collection of verse numbers from the same chapter.

This distinction prevents a citation such as Psalms 104:2,5 from being misrepresented as Psalms 104:2-5. A discrete selection is displayed as one editorial source, while its individual verses remain explicit. Collections that span more than one chapter should be represented by multiple Passage members rather than stretching this type beyond a single chapter.

---

## Ripple

A Ripple represents a meaningful intra-biblical relationship.

A Ripple is an independent entity.

It does NOT "belong" to one verse.

Passages participate in a Ripple.

Example:

Ripple:
"Creation of heaven and earth"

Members:
- Genesis 1:1
- Isaiah 45:12
- Psalms ...
- Job ...

A Ripple may contain two or many passages.

---

## RippleMember

Represents the participation of a Passage in a Ripple.

A member may have a role.

Initial candidate roles:

- anchor
- parallel
- continuation
- fulfillment
- explanation
- contrast
- account
- retelling

The role vocabulary is NOT considered final.

A Ripple may designate one member as its canonical or primary anchor.

This supports the editorial principle that a topic may be presented fully at its primary occurrence and referenced elsewhere.

---

## RippleType

Initial candidate types:

### Thematic parallel

Passages expressing substantially related content or ideas.

### Continuation / completion

A later passage completes or continues information from another passage.

### Explanation

A biblical passage helps clarify something unclear in another biblical passage.

### Contrast / tension

Passages appear to present conflicting or contrasting information.

The system exposes the relationship without necessarily resolving it.

### Literary / stylistic parallel

Meaningful similarity in wording, structure or literary presentation.

### Parallel narrative

Two larger narrative passages meaningfully correspond.

These types are provisional.

Do not make adding or changing types expensive.

---

## Connection

Optional finer-grained relationship inside a Ripple.

This is useful when a large Ripple connects two narratives but editors also want to identify specific verse-to-verse correspondences.

Example:

Ripple:
"Abraham's servant — event vs retelling"

Passages:
Genesis 24:1-27
Genesis 24:34-48

Connections may then map particular statements within those passages.

Connection is not required for every Ripple.

It may be omitted from the first implementation if it complicates the prototype.

---

## Proposal

A suggested new Ripple or suggested modification to an existing Ripple.

A Proposal is NOT published content.

Possible states:

- draft
- open
- accepted
- rejected

A proposal contains:

- proposer;
- passages;
- proposed RippleType;
- reasoning;
- timestamps.

Rejected proposals must be retained.

---

## Discussion

A chronological discussion associated with a Proposal.

A Discussion consists of comments by editors.

The discussion is part of the project's editorial history and should not disappear after a decision.

---

## Decision

Records the editorial outcome of a Proposal.

Possible outcomes:

- accepted;
- rejected.

A Decision should record:

- decision;
- editor;
- timestamp;
- reasoning.

---

## EditorialRule

A reusable statement of editorial policy.

Rules may emerge from concrete discussions rather than being designed entirely in advance.

Example:

"General wisdom statements should not normally be linked to a biblical character merely because the character illustrates that principle."

A Proposal or Decision may reference one or more EditorialRules.

---

## Evidence strength

Some connections are explicitly made by the biblical text itself, while others are editorially inferred.

Potential values:

- explicit
- strong_parallel
- inferred

This concept is useful but does not have to appear in the first UI.

It represents the basis of the connection, NOT a theological truth score.

---

## Important modeling rule

Do not encode editorial display policy into the underlying knowledge model.

Example:

The editors have not yet fully decided when later information about a person or place should be shown.

The data model should be capable of representing such relationships even if current editorial policy hides or filters them.

Storage and presentation policy are separate concerns.
