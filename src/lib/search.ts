import type { Realm, Style } from "../types"

const tokenize = (q: string) =>
  q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)

const haystack = (s: Style) =>
  [
    s.name,
    s.era,
    s.origin,
    s.region,
    s.summary,
    s.look,
    s.bestFor,
    s.compact,
    ...s.aka,
    ...s.tags,
    ...s.examples,
    ...s.realms,
  ]
    .join(" ")
    .toLowerCase()

const cache = new Map<string, string>()
const hay = (s: Style) => {
  let h = cache.get(s.id)
  if (!h) {
    h = haystack(s)
    cache.set(s.id, h)
  }
  return h
}

export function scoreStyle(s: Style, tokens: string[], raw: string): number {
  if (!tokens.length && !raw) return 1
  const h = hay(s)
  const name = s.name.toLowerCase()
  const id = s.id.toLowerCase()
  let n = 0
  if (raw && (name === raw || id === raw)) n += 80
  if (raw && (name.includes(raw) || id.includes(raw))) n += 40
  for (const t of tokens) {
    if (name === t || id === t) n += 50
    else if (name.includes(t) || id.includes(t)) n += 28
    else if (s.aka.some((a) => a.toLowerCase().includes(t))) n += 22
    else if (s.tags.some((tag) => tag.toLowerCase().includes(t))) n += 16
    else if (s.origin.toLowerCase().includes(t)) n += 12
    else if (h.includes(t)) n += 6
    else return -1
  }
  return n
}

export function searchStyles(
  styles: Style[],
  query: string,
  realm: Realm | "all",
  region: string | "all",
): Style[] {
  const raw = query.trim().toLowerCase()
  const tokens = tokenize(query)
  let list = styles
  if (realm !== "all") list = list.filter((s) => s.realms.includes(realm))
  if (region !== "all") list = list.filter((s) => s.region === region)
  if (!raw) return list
  return list
    .map((s) => ({ s, n: scoreStyle(s, tokens, raw) }))
    .filter((x) => x.n >= 0)
    .sort((a, b) => b.n - a.n || a.s.name.localeCompare(b.s.name))
    .map((x) => x.s)
}

export function relatedQueryHits(styles: Style[], query: string, limit = 8): Style[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  return styles
    .map((s) => ({ s, n: scoreStyle(s, tokens, query.trim().toLowerCase()) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map((x) => x.s)
}
