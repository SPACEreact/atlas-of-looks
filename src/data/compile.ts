import type { RawStyle, Realm, Style } from "../types"
import { STYLE_IMAGES } from "./style-images"

const split = (s?: string) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

export function compile(r: RawStyle): Style {
  const image = STYLE_IMAGES[r.id]
  if (!image) throw new Error(`Missing image manifest entry for ${r.id}`)
  const palette = split(r.palette)
  const tags = split(r.tags)
  const aka = split(r.aka)
  const realms = split(r.realms) as Realm[]
  const compact =
    r.compact ||
    [r.name, r.origin, r.era, ...tags.slice(0, 8)].join(", ")

  const prompt = `Create an image of {subject} in the authentic visual language of ${r.name} (${r.era}, ${r.origin}). ${r.look.trim()} Treat this as a complete style system: line quality, lighting, pigment, spatial logic, and surface texture must all belong to this tradition. Color world: ${palette.join(", ")}. ${r.bestFor ? `Especially strong for ${r.bestFor}.` : ""} Do not genericize into stock fantasy illustration. Do not mix in unrelated art movements unless asked.`

  return {
    id: r.id,
    name: r.name,
    aka,
    era: r.era,
    origin: r.origin,
    region: r.region,
    realms,
    tags,
    summary: r.summary,
    look: r.look,
    palette,
    prompt,
    compact,
    avoid: r.avoid || "generic CGI, stock fantasy, mismatched perspective",
    bestFor: r.bestFor || "any subject that can hold this visual grammar",
    examples: split(r.examples),
    related: split(r.related),
    image: {
      src: `${import.meta.env.BASE_URL}style-images/${image.file}`,
      alt: image.alt,
      kind: image.kind,
      title: image.title,
      creator: image.creator,
      sourceUrl: image.sourceUrl,
      license: image.license,
      licenseUrl: image.licenseUrl,
    },
    hero: r.hero ? `${import.meta.env.BASE_URL}${r.hero.replace(/^\//, "")}` : undefined,
  }
}

export function compileAll(rows: RawStyle[]): Style[] {
  return rows.map(compile)
}

export function fillRelated(styles: Style[]): Style[] {
  const byId = new Map(styles.map((s) => [s.id, s]))
  return styles.map((s) => {
    if (s.related.length >= 3) {
      return { ...s, related: s.related.filter((id) => byId.has(id) && id !== s.id) }
    }
    const scored = styles
      .filter((o) => o.id !== s.id)
      .map((o) => {
        let n = 0
        if (o.region === s.region) n += 2
        if (o.origin === s.origin) n += 2
        for (const t of s.tags) if (o.tags.includes(t)) n += 3
        for (const r of s.realms) if (o.realms.includes(r)) n += 1
        return { id: o.id, n }
      })
      .sort((a, b) => b.n - a.n)
    const extra = scored.slice(0, 6).map((x) => x.id)
    const merged = [...new Set([...s.related.filter((id) => byId.has(id)), ...extra])].filter((id) => id !== s.id)
    return { ...s, related: merged.slice(0, 8) }
  })
}
