# Grok handoff — finish the 433-image curation

## Product direction

Keep this a pure, minimal, image-first Atlas of Looks. Preserve search, realm and region filters, subject-filled prompts, random style, collections, saved styles, prompt copying, palettes, visual DNA, touchstones, and related styles. Do not restore Mixer or Dream Forge. The Dreams realm is part of the 433-style archive and stays.

All images must remain repository-local under `public/style-images/`, so they render from GitHub Pages on any device. Do not hotlink.

## Honest status at this checkpoint

All 433 cards have local image files and the site is deployable. A full contact-sheet audit classified 131 images as visually acceptable at this checkpoint. The remaining 302 are present and load correctly, but still need visual-relevance curation:

- 9 invented Dreams need bespoke generation: `ash-opera`, `coral-brutalism`, `second-shadow`, `quiet-apocalypse-pastel`, `myth-buffering`, `dream-crt`, `honey-geometry`, `lantern-organs`, `snow-that-is-paper`.
- 179 cinema, animation, comics, games, photography, design, and web entries need bespoke generation. The audit contains the exact remaining IDs and a safe, style-specific generation brief for every one.
- 114 fine-art, cultural-tradition, and material entries need a canonical open-access source or, when that cannot be verified, a bespoke original image.

Already integrated during this pass:

- 39 bespoke Dream images.
- 12 bespoke media images: `2001`, `flcl`, `gainax`, `ghibli`, `kaguya`, `kyoto-animation`, `promare`, `shaft`, `shinkai`, `takahata`, `trigger`, `ufotable`.
- 11 canonical sourced replacements: `fleischer`, `rubber-hose`, `film-noir`, `german-expressionist-film`, `little-nemo`, `newspaper-strip`, `fsa-dustbowl`, `war-photo`, `crt`, `ascii`, `dither-1bit`.
- 69 previously sourced images passed the contact-sheet review and should not be replaced casually.

## Audit files

- `handoff/dreams-misc.json` — all 48 Dreams with exact prompts; skip the 39 already marked above and generate the remaining nine.
- `handoff/media-design.json` — all 208 media/design entries. Use `items[id].recommended.generationBrief` for entries whose `decision` is `generate`. Skip the 12 completed IDs above. Eleven `replace` entries are already integrated.
- `handoff/fine-culture.json` — all 177 fine-art/culture/material entries. Work only on records whose `status` is `replace`; 63 `current_ok` records passed review.

## Required replacement workflow

1. Prefer a canonical museum open-access, Wikimedia Commons, or Openverse asset only when the actual image visibly demonstrates the named style and its per-file license is verified.
2. If a trustworthy representative is unavailable, generate a finished original 3:2 scene from the audit brief. Do not use palette swatches, abstract placeholder geometry, merchandise, event photos, logos, review graphics, or borrowed game/movie screenshots.
3. Visually inspect every output. Reject text, watermarks, malformed details, generic imagery, and images that merely match a keyword.
4. Save the final as a web-optimized 720×480 JPEG when practical, named `public/style-images/<style-id>.jpg`.
5. Update that ID in `public/style-images/credits.json`. Use `kind: "generated"`, creator `Atlas of Looks`, and license `Original` for generated pieces. Preserve full creator/source/license details for sourced pieces.
6. Run `npm run images:sync` to rebuild `src/data/style-images.ts` and `ATTRIBUTION.md`.
7. Run the complete verification suite:

   ```
   npm run images:check
   npm run lint
   npm run build
   ```

8. Commit and push to `main`; the existing Pages workflow deploys the project at `https://spacereact.github.io/atlas-of-looks/`.

## Important guardrails

- Do not run `npm run images:refresh` over this library. It is an automated bootstrapper and can replace curated images with weak keyword matches.
- Do not claim that a generated image is a historical work. The detail view labels it “Original Atlas image.”
- Be especially careful with Indigenous cultural imagery and living traditions. Follow the notes in `fine-culture.json`, retain named-artist/community attribution, and do not treat a permissive file license as the only ethical consideration.
- Keep exactly 433 manifest records and 433 image files; the validator fails on missing or orphaned files.
