import type { Style } from "../types"
import { relatedQueryHits } from "./search"

const LIGHT = [
  "single-source tenebrism",
  "overcast paper-white",
  "magic-hour backlight",
  "fluorescent institutional",
  "candle and gold-leaf bounce",
  "wet neon in rain",
  "north-window Vermeer hush",
  "eclipse-noon black sun",
  "milk-opaque high-key",
  "scanline phosphor bloom",
  "torchlit cave flicker",
  "submerged green shafts",
]

const LINE = [
  "carved woodblock contour",
  "calligraphic wet ink",
  "even ligne claire",
  "scratchboard dense hatch",
  "no line, only stain",
  "pixel cluster as contour",
  "lead-came stained-glass",
  "whiplash nouveau curve",
  "kirby-krackle energy",
  "sumi dry-brush bone",
]

const SPACE = [
  "no vanishing point, stacked registers",
  "one-point corridor theology",
  "aerial ukiyo crop",
  "reverse-perspective icon space",
  "liminal empty familiar",
  "scale inversion (furniture as cliffs)",
  "planimetric dollhouse flat",
  "multiple medieval viewpoints",
  "fog as draw-distance of feeling",
  "nested mise-en-abyme rooms",
]

const SURFACE = [
  "raw washi tooth",
  "oil impasto ridges",
  "CRT phosphor glass",
  "crushed mineral on silk",
  "xerox grit",
  "wax encaustic skin",
  "tesserae grout glitter",
  "analog film foxing",
  "riso misregister grain",
  "condensation on wet glass",
]

const PALETTES: string[][] = [
  ["#1a1a16", "#c9a227", "#8b1e1e", "#d8c8b0"],
  ["#0a1220", "#c45a6a", "#1aa0c8", "#c9a227"],
  ["#5a8c6a", "#d4b45a", "#6a8cba", "#f0e4cc"],
  ["#6a5a44", "#c4a46a", "#1a1a16", "#8a7a68"],
  ["#c45a6a", "#6a8cba", "#d8c8b0", "#1a1a16"],
  ["#1f4d9a", "#c4122f", "#c9a227", "#f0e4cc"],
  ["#2f5d5a", "#c4a46a", "#1a1a16", "#6a8cba"],
  ["#c4122f", "#1a1a16", "#f2c14e", "#3a5a8c"],
]

const pick = <T>(arr: T[], n: number) => arr[Math.abs(n) % arr.length]

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export type Forged = {
  id: string
  name: string
  era: string
  origin: string
  summary: string
  look: string
  palette: string[]
  prompt: string
  compact: string
  avoid: string
  bestFor: string
  cousins: Style[]
  source: "local" | "spacexai"
}

export function forgeLocal(description: string, catalog: Style[]): Forged {
  const d = description.trim()
  const h = hash(d.toLowerCase())
  const cousins = relatedQueryHits(catalog, d, 6)
  const light = pick(LIGHT, h)
  const line = pick(LINE, h >> 3)
  const space = pick(SPACE, h >> 7)
  const surface = pick(SURFACE, h >> 11)
  const palette = pick(PALETTES, h >> 15).slice()
  const words = d.split(/\s+/).filter((w) => w.length > 3).slice(0, 8)
  const name =
    titleCase(words.slice(0, 3).join(" ")) || `Unnamed look ${h.toString(16).slice(0, 4)}`
  const cousinLooks = cousins
    .slice(0, 3)
    .map((c) => c.name)
    .join(", ")
  const look = `Invented visual language drawn from the description: “${d}”. Lighting: ${light}. Line: ${line}. Space: ${space}. Surface: ${surface}. ${cousinLooks ? `Distant cousins in the archive: ${cousinLooks} — steal grammar, not costume.` : "No close cousin; treat as a new school."} Keep it coherent: one climate, one craft, one set of rules. Tender or terrible as the description asks, never generic stock fantasy.`
  const prompt = `A {subject}, created in an invented visual language called ${name}. ${look} Color world: ${palette.join(", ")}. Do not collapse into a known brand or a default art-station look. Commit.`
  return {
    id: `forged-${h.toString(16)}`,
    name,
    era: "invented / dream / now",
    origin: "described, then built",
    summary: d.length > 140 ? d.slice(0, 137) + "…" : d,
    look,
    palette,
    prompt,
    compact: `${name}, ${light}, ${line}, ${space}, ${surface}`,
    avoid: "stock fantasy, random mashup without rules, known studio photocopy",
    bestFor: "whatever the description was reaching for",
    cousins,
    source: "local",
  }
}

export async function forgeRemote(description: string, catalog: Style[]): Promise<Forged> {
  const cousins = relatedQueryHits(catalog, description, 8)
  const res = await fetch("/api/forge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      cousins: cousins.map((c) => ({ name: c.name, look: c.look, era: c.era })),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Forge failed (${res.status})`)
  }
  const data = (await res.json()) as Partial<Forged> & { name: string; look: string; prompt: string }
  const local = forgeLocal(description, catalog)
  return {
    ...local,
    name: data.name || local.name,
    era: data.era || local.era,
    origin: data.origin || local.origin,
    summary: data.summary || local.summary,
    look: data.look || local.look,
    palette: Array.isArray(data.palette) && data.palette.length ? data.palette : local.palette,
    prompt: data.prompt || local.prompt,
    compact: data.compact || local.compact,
    avoid: data.avoid || local.avoid,
    bestFor: data.bestFor || local.bestFor,
    cousins,
    source: "spacexai",
  }
}

export async function apiStatus(): Promise<{ forge: boolean; imagine: boolean }> {
  try {
    const res = await fetch("/api/status")
    if (!res.ok) return { forge: false, imagine: false }
    return (await res.json()) as { forge: boolean; imagine: boolean }
  } catch {
    return { forge: false, imagine: false }
  }
}
