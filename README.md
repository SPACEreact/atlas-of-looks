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

Every one of the 433 styles has a local image. Openly licensed images include source and license credits in the detail view and in `public/style-images/ATTRIBUTION.md`. When no safe source is available, the atlas uses an original palette study generated from the style data.

To rebuild the image library:

```
npm run images:refresh
```
