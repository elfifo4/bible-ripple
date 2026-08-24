# Codex kickoff prompt

We are starting a new open-source project called Bible Ripple.

Repository:
https://github.com/elfifo4/bible-ripple

I am providing a ZIP handoff package. Extract its contents into the repository root, preserving the folder structure. Review README.md and every file under /docs before writing implementation code.

This project is currently in product discovery. Do not treat the documentation as an immutable implementation spec: flag material contradictions or UX/domain-model issues, but do not silently change unresolved editorial decisions.

## First phase

1. Inspect the current repository before changing anything.
2. Extract/copy the handoff package into the repository root.
3. Read:
   - README.md
   - docs/PRODUCT.md
   - docs/DOMAIN_MODEL.md
   - docs/EDITORIAL_PRINCIPLES.md
   - docs/MVP.md
4. Summarize:
   - your understanding of the product;
   - the primary editor workflow;
   - any contradictions or ambiguities that materially affect the prototype.
5. Propose a minimal information architecture and component structure for the four MVP screens.
6. Propose TypeScript mock-data types/shapes that exercise the domain model without prematurely designing a backend.
7. Then scaffold and implement a low-fidelity interactive prototype with React + TypeScript + Vite.

## Constraints

- Hebrew-first UI.
- RTL layout.
- Desktop-first editorial prototype.
- Keep future responsive design possible.
- No backend.
- No Firebase.
- No authentication.
- No AI features.
- No complete Tanakh import.
- No graph visualization.
- No genealogy or maps.
- No unnecessary state-management library.
- Use local mock data only.
- Prefer semantic HTML and accessible controls.
- Keep visual styling restrained and low-fidelity.
- Do not add a software/content license without asking first.
- Do not commit the original private source document from the project's creator.

## Critical workflow

The prototype must make this flow testable:

read chapter
→ select passage
→ inspect approved ripples
→ open a ripple
→ propose a relationship
→ discuss
→ accept/reject
→ preserve the decision/history

Include enough mock data to demonstrate:
- approved ripples;
- an open proposal;
- a rejected proposal with rationale;
- editorial rules.

A key usability test is:
"Open Genesis 6:9 and propose Proverbs 20:7 as a possible Ripple."

## Deployment

Once the prototype works locally:

1. Ensure it builds successfully.
2. Configure Vite correctly for deployment under the `bible-ripple` repository base path.
3. Add a GitHub Actions workflow for GitHub Pages.
4. Document local development and deployment in README.md.
5. Run tests/build/lint available in the project and fix issues before finishing.

## Working style

Work incrementally.

Before making a major domain-model decision that conflicts with /docs, explain the issue and ask rather than silently redefining the product.

For normal implementation details, make reasonable choices and continue.

At the end, report:
- files created/changed;
- commands run and their results;
- known limitations;
- the GitHub Pages setup steps that still require manual action, if any.
