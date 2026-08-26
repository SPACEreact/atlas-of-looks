# Atlas of Looks

Live: **https://spacereact.github.io/atlas-of-looks/**

A searchable archive of visual languages — cultures, art history, mediums, cinema, animation studios, games, print, photography, digital subcultures, and invented dream styles. Each entry is a complete grammar plus a copy-ready image prompt.

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
- **Copy prompt** or compact tags from a card.
- **Mixer** blends 2–3 looks (first owns space/light).
- **Dream forge** invents a new style from a description. Works offline. With `XAI_API_KEY` in `.env` it uses SpaceXAI (`grok-4.6`) for a richer bible.

## Optional AI

Copy `.env.example` to `.env` and add a key from [console.x.ai](https://console.x.ai). Local only — the hosted site uses the offline forge.
