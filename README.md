# Atlas of Looks

Live: **https://spacereact.github.io/atlas-of-looks/**

A searchable, image-first archive of 433 visual languages — cultures, art history, mediums, cinema, animation studios, games, print, photography, digital subcultures, and imagined styles. Each entry pairs a representative image with a complete visual grammar and a copy-ready image prompt.

## Run locally

```bat
start.bat
```

or

```
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Use

- **Search** anything (`ukiyo-e`, `ghibli`, `bloodborne`, `a wet glass city`). Press `/`.
- **Subject** at the top fills `{subject}` in every prompt.
- **Open any image** for its visual DNA, palette, touchstones, related looks, and prompt.
- **Copy prompt** or compact tags from a card.
- **Save looks** locally in your browser.

## Image library

Every one of the 433 styles has a repository-local image, so the full atlas works from GitHub Pages without hotlinked thumbnails. Openly licensed images include source and license credits in the detail view and in `public/style-images/ATTRIBUTION.md`. When a trustworthy representative source is unavailable, the target is a bespoke original Atlas specimen.

The complete visual-relevance audit and remaining curation work are documented in [`GROK_HANDOFF.md`](GROK_HANDOFF.md). The handoff is intentionally explicit about which legacy automated matches still need replacement.

After changing `public/style-images/credits.json`, rebuild the TypeScript manifest and attribution table with:

```
npm run images:sync
```

`images:refresh` is only a bootstrap tool for an empty library. Do not run it over the curated set: automated Openverse matches require human visual review.
