# Bible text source

## Decision

Bible Ripple uses Sefaria as text infrastructure while keeping its editorial knowledge independent. Ripples, proposals, discussions, decisions, rules and explanations are Bible Ripple data; Sefaria links are not imported as approved Ripples.

## API

The prototype uses Sefaria's current Texts v3 endpoint:

```text
GET https://www.sefaria.org/api/v3/texts/{tref}
  ?version=hebrew|Tanach with Ta'amei Hamikra
  &return_format=text_only
```

Examples:

- chapter: `Genesis 1`
- verse: `Genesis 1:1`
- range: `Genesis 24:1-27`

The older `/api/texts/{tref}` endpoint is deprecated and is not used. The v3 response supplies a normalized `ref`, selected version metadata and either a segment string or an array of segment strings.

## Canonical references

Editorial entities point to a `PassageRef`. Its `canonicalRef` uses normalized Sefaria-style English references such as `Genesis 6:9` or `Proverbs 20:7`. English identifiers are not UI labels; Hebrew book names remain separate display metadata.

Biblical text is not the identity of a Passage and is not stored in a Ripple.

## Selected Hebrew version

- Version title: `Tanach with Ta'amei Hamikra`
- Language: Hebrew
- Contents: consonantal text, vowel points and cantillation marks
- Source reported by Sefaria: `tanach.us`
- License reported by Sefaria's Versions API: `Public Domain`

The UI still identifies Sefaria and the selected version even though the reported public-domain status does not require attribution. No commentary or translation is retrieved.

Text license metadata is version-specific and must be checked again before changing versions.

## Runtime and fallback

`SefariaBibleTextProvider` fetches text directly in the browser. A live request tested with the GitHub Pages origin returned `Access-Control-Allow-Origin: *`. This is current API behavior, not a permanent availability guarantee.

`FallbackBibleTextProvider` switches to `MockBibleTextProvider` when a live request fails. The fallback exists only to keep the editorial prototype usable and is deliberately incomplete. It must not be treated as a canonical Tanakh edition.

The provider uses a small in-memory request cache. There is no service worker, IndexedDB, backend cache or full Tanakh copy in this repository.

Tests instantiate `MockBibleTextProvider` explicitly so that they remain deterministic and do not call the network.

## Changing provider or version

Provider implementations and the selected `SEFARIA_VERSION` constant live in `src/bibleTextProvider.ts`. React receives a provider at the root `App`; editorial components do not construct Sefaria URLs.

Before selecting another version, verify its exact version title, license, source and attribution requirements using Sefaria's Versions API.

## Official documentation

- [Sefaria Texts v3](https://developers.sefaria.org/reference/get-v3-texts)
- [Sefaria Versions API](https://developers.sefaria.org/reference/get-versions)
- [Sefaria reference validation](https://developers.sefaria.org/reference/get-ref)
- [Sefaria copyright and data use](https://developers.sefaria.org/docs/usage-of-our-name-and-logo)
