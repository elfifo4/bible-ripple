# Bible Ripple

Bible Ripple (Hebrew: "אדוות התנ״ך") is a collaborative project for exploring and curating connections within the Hebrew Bible.

The project connects biblical passages through thematic parallels, continuations of narratives, explanations, contrasts, literary echoes, and other meaningful intra-biblical relationships.

The goal is not to create another biblical commentary.

Instead, Bible Ripple lets the Bible illuminate itself by exposing the network of relationships between passages throughout Tanakh.

## Project status

Early product discovery / prototype.

The current focus is an editorial workspace for a small group of editors.

The public reading experience will come later.

## Core idea

Biblical passages are nodes.

"Ripples" are meaningful relationships between them.

A ripple may connect:
- a verse to another verse;
- a verse to multiple passages;
- a narrative to its continuation;
- a prophecy or declaration to its fulfillment;
- two parallel narratives;
- passages that illuminate or challenge one another.

## Language

The application UI is primarily Hebrew and RTL.

Code, technical documentation, identifiers, and commit messages should generally be in English.

## Interactive prototype

This repository contains a low-fidelity, Hebrew-first editorial prototype. It uses local mock data to test this workflow:

> read chapter → select passage → inspect approved ripples → open a ripple → propose a relationship → discuss → accept/reject → preserve the decision/history

The prototype intentionally has no backend, authentication, AI features, or complete Tanakh corpus.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173/bible-ripple/`.

Quality checks:

```bash
npm run lint
npm test
npm run build
npm run preview
```

## GitHub Pages deployment

The Vite base path is configured as `/bible-ripple/`. The workflow at `.github/workflows/deploy-pages.yml` builds and deploys every push to `main`, and can also be run manually.

In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. After the workflow succeeds, the site will be available at `https://elfifo4.github.io/bible-ripple/`.

No license has been added. The project owner should choose a software and content license separately before publication.
