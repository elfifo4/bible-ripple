# Bible Ripple

Bible Ripple (Hebrew: "אדוות התנ״ך") is a collaborative project for exploring and curating connections within the Hebrew Bible.

The project connects biblical passages through thematic parallels, continuations of narratives, explanations, contrasts, literary echoes, and other meaningful intra-biblical relationships.

The goal is not to create another biblical commentary.

Instead, Bible Ripple lets the Bible illuminate itself by exposing the network of relationships between passages throughout Tanakh.

## Project status

Early product discovery / prototype.

The current focus is a protected editorial workspace for a small group of editors.

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

This repository contains a low-fidelity, Hebrew-first editorial prototype. Editorial data is stored in a protected Firestore database to test this workflow:

> read chapter → select passage → inspect approved ripples → open a ripple → propose a relationship → discuss → accept/reject → preserve the decision/history

The prototype intentionally has no AI features or complete Tanakh corpus. Google sign-in is provided by Firebase Authentication. Firestore Security Rules restrict editorial content to explicitly allowlisted, verified Google accounts.

Biblical text is fetched from [Sefaria](https://www.sefaria.org/) using the public-domain Hebrew version **Tanach with Ta'amei Hamikra**, which includes vowel points and cantillation marks. A small local fallback keeps the editorial workflow usable during network failures. See [docs/TEXT_SOURCE.md](docs/TEXT_SOURCE.md) for API, reference, licensing and architecture details.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173/`. Google sign-in requires the local domain to be authorized in Firebase Authentication.

For a complete local editorial environment, including Auth and Firestore emulators, a verified test editor and the approved Genesis 1 ripples, run:

```bash
npm run dev:test
```

Open the printed local URL and choose **כניסת בדיקה מקומית**. This button and its fixed local-only credentials exist only when `VITE_USE_FIREBASE_EMULATORS=true`; production builds never connect to the emulators or display the button. The command stops and clears the temporary emulator data when it exits.

Quality checks:

```bash
npm run lint
npm test
npm run test:rules
npm run build
npm run preview
```

## Firebase deployment

The production site is hosted at [https://bible-ripple.web.app/](https://bible-ripple.web.app/). The workflow at `.github/workflows/deploy-firebase.yml` runs lint, tests and build, then deploys every push to `main`.

The repository secret `FIREBASE_SERVICE_ACCOUNT_BIBLE_RIPPLE` contains the dedicated Firebase Hosting deployment credential. Deploy manually with:

```bash
npm run build
firebase deploy --only hosting --project bible-ripple
```

Authentication and Firestore rules are configured in `firebase.json` and `firestore.rules`. Deploy those explicitly after reviewing security changes:

```bash
firebase deploy --only auth,firestore:rules --project bible-ripple
```

The editorial collections are `ripples`, `proposals`, and `editorialRules`. Access is granted by a server-managed document at `editorAccess/{lowercase-email}`. Never place private editorial data or service-account credentials in this public repository.

No license has been added. The project owner should choose a software and content license separately before publication.
