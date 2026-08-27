import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import zlib from "node:zlib"
import ts from "typescript"

const ROOT = path.resolve(import.meta.dirname, "..")
const DATA_DIR = path.join(ROOT, "src", "data")
const IMAGE_DIR = path.join(ROOT, "public", "style-images")
const MANIFEST_FILE = path.join(DATA_DIR, "style-images.ts")
const CREDITS_JSON = path.join(IMAGE_DIR, "credits.json")
const CREDITS_MD = path.join(IMAGE_DIR, "ATTRIBUTION.md")
const USER_AGENT = "AtlasOfLooks/1.0 (https://github.com/spacereact/atlas-of-looks)"
const ALLOWED_LICENSES = new Set(["cc0", "pdm", "by", "by-sa"])
const DATA_FILES = [
  "cultures.ts",
  "history.ts",
  "mediums.ts",
  "cinema.ts",
  "animation.ts",
  "games.ts",
  "comics.ts",
  "photo.ts",
  "digital.ts",
  "dreams.ts",
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function stringValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return ""
}

async function readStyles() {
  const rows = []
  for (const file of DATA_FILES) {
    const sourceText = await fs.readFile(path.join(DATA_DIR, file), "utf8")
    const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const row = {}
        for (const prop of node.properties) {
          if (!ts.isPropertyAssignment(prop)) continue
          const key = prop.name.getText(source).replace(/^['"]|['"]$/g, "")
          row[key] = stringValue(prop.initializer)
        }
        if (row.id && row.name && row.palette) rows.push(row)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()]
  unique.sort((a, b) => a.id.localeCompare(b.id))
  return unique
}

function tokens(value) {
  const stop = new Set(["the", "and", "art", "style", "school", "mode", "a", "of", "in", "for", "to"])
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stop.has(token))
}

function firstTouchstone(style) {
  const first = (style.examples || "").split(",")[0].trim()
  return first.toLowerCase() === "invented" ? "" : first
}

function searchQueries(style) {
  const touchstone = firstTouchstone(style)
  const tags = (style.tags || "").split(",").slice(0, 2).join(" ")
  const primary = touchstone ? `${style.name} ${touchstone}` : `${style.name} ${style.origin}`
  const secondary = `${style.name} ${tags}`.trim()
  return [...new Set([primary, secondary, style.name].filter(Boolean))]
}

function scoreResult(style, result, query) {
  const haystack = [
    result.title,
    result.creator,
    result.category,
    ...(result.tags || []).map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  const nameTokens = tokens(style.name)
  const queryTokens = tokens(query)
  let score = 0
  for (const token of nameTokens) if (haystack.includes(token)) score += 14
  for (const token of queryTokens) if (haystack.includes(token)) score += 4
  if ((result.title || "").toLowerCase().includes(style.name.toLowerCase())) score += 28
  if (result.source === "wikimedia") score += 8
  if (["smithsonian", "met", "rijksmuseum", "clevelandmuseum"].includes(result.source)) score += 7
  if (result.width && result.height) {
    const ratio = result.width / result.height
    if (ratio >= 1.15 && ratio <= 2.2) score += 6
    if (result.width >= 900) score += 3
  }
  if (/\b(logo|icon|flag|coat of arms|diagram|map pin|avatar)\b/i.test(result.title || "")) score -= 18
  if (/\bscan\b/i.test(result.title || "")) score -= 3
  return score
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  })
  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    const retry = Number(response.headers.get("retry-after") || 0)
    await wait(Math.max(retry * 1000, 1500 * 2 ** attempt))
    return fetchJson(url, attempt + 1)
  }
  if (!response.ok) throw new Error(`Openverse ${response.status}`)
  return response.json()
}

async function findOpenImage(style) {
  for (const query of searchQueries(style)) {
    const url = new URL("https://api.openverse.org/v1/images/")
    url.searchParams.set("q", query)
    url.searchParams.set("page_size", "12")
    url.searchParams.set("mature", "false")
    url.searchParams.set("license", [...ALLOWED_LICENSES].join(","))
    const payload = await fetchJson(url)
    const eligible = (payload.results || [])
      .filter((result) => result.thumbnail && ALLOWED_LICENSES.has(result.license))
      .map((result) => ({ result, score: scoreResult(style, result, query) }))
      .sort((a, b) => b.score - a.score)
    if (eligible[0] && eligible[0].score >= 8) return eligible[0].result
  }
  return null
}

function extensionFor(contentType) {
  if (contentType.includes("png")) return "png"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("gif")) return "gif"
  return "jpg"
}

async function downloadThumbnail(result, id, attempt = 0) {
  const response = await fetch(result.thumbnail, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    if (attempt < 2 && (response.status === 415 || response.status === 424 || response.status >= 500)) {
      await wait(450 * 2 ** attempt)
      return downloadThumbnail(result, id, attempt + 1)
    }
    throw new Error(`thumbnail ${response.status}`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 2_000 || bytes.length > 1_500_000) throw new Error(`thumbnail size ${bytes.length}`)
  const ext = extensionFor(response.headers.get("content-type") || "")
  const file = `${id}.${ext}`
  await fs.writeFile(path.join(IMAGE_DIR, file), bytes)
  return file
}

function hash32(value) {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function parseHex(value) {
  const hex = value.replace("#", "").trim()
  if (/^[0-9a-f]{3}$/i.test(hex)) return [...hex].map((part) => Number.parseInt(part + part, 16))
  if (/^[0-9a-f]{6}$/i.test(hex)) return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
  return [36, 34, 30]
}

function mixColor(a, b, amount) {
  const t = Math.max(0, Math.min(1, amount))
  return a.map((value, index) => Math.round(value + (b[index] - value) * t))
}

let crcTable
function crc32(buffer) {
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, n) => {
      let c = n
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      return c >>> 0
    })
  }
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

function generatedStudy(style) {
  const width = 720
  const height = 480
  const seed = hash32(`atlas-image-v1:${style.id}`)
  const palette = (style.palette || "#24221e,#b79561,#ddd4c3")
    .split(",")
    .map(parseHex)
  while (palette.length < 4) palette.push(palette[palette.length - 1])
  const indexedPalette = []
  for (let group = 0; group < 8; group += 1) {
    const base = palette[group % palette.length]
    const neighbor = palette[(group + 1) % palette.length]
    for (let shade = 0; shade < 8; shade += 1) {
      let color = mixColor(base, neighbor, shade / 14)
      color = mixColor([8, 8, 7], color, 0.48 + shade * 0.07)
      indexedPalette.push(color)
    }
  }
  const mode = seed % 6
  const raw = Buffer.alloc((width + 1) * height)
  let offset = 0
  for (let y = 0; y < height; y += 1) {
    raw[offset++] = 0
    for (let x = 0; x < width; x += 1) {
      const nx = x / width
      const ny = y / height
      const cellX = Math.floor(x / 6)
      const cellY = Math.floor(y / 6)
      const noiseSeed = Math.imul(cellX + seed, 374761393) ^ Math.imul(cellY + 17, 668265263)
      const noise = (((noiseSeed ^ (noiseSeed >>> 13)) >>> 0) % 8) / 7
      let accent = 0
      if (mode === 0) accent = Math.sin((nx * 8 + ny * 5) * Math.PI + (seed % 11)) > 0.38 ? 1 : 0
      if (mode === 1) accent = Math.sin(Math.hypot(nx - 0.42, ny - 0.5) * 42 - seed % 9) > 0.55 ? 1 : 0
      if (mode === 2) accent = (Math.floor(nx * 9) + Math.floor(ny * 7) + (seed % 3)) % 4 === 0 ? 1 : 0
      if (mode === 3) accent = Math.sin(nx * 17 + Math.sin(ny * 9) * 2.5) > 0.5 ? 1 : 0
      if (mode === 4) accent = Math.abs(nx - 0.5) + Math.abs(ny - 0.5) < 0.34 ? 1 : 0
      if (mode === 5) accent = ((x + Math.floor(ny * 220)) % 96) < 18 ? 1 : 0
      const glow = Math.max(0, 1 - Math.hypot(nx - 0.72, ny - 0.28) * 2.5)
      const group = (Math.floor(nx * 2 + ny * 2) + accent * 2 + Math.floor(glow * 2) + mode) % Math.min(8, palette.length + 2)
      const vignette = Math.max(0, Math.hypot(nx - 0.5, ny - 0.5) - 0.38)
      const shade = Math.max(0, Math.min(7, Math.floor(2 + nx * 2 + ny * 2 + noise * 2 - vignette * 5)))
      raw[offset++] = group * 8 + shade
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 3
  const paletteBytes = Buffer.from(indexedPalette.flat())
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    pngChunk("IHDR", header),
    pngChunk("PLTE", paletteBytes),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}

async function writeGeneratedFallback(style) {
  const file = `${style.id}.png`
  await fs.writeFile(path.join(IMAGE_DIR, file), generatedStudy(style))
  return file
}

function licenseLabel(value) {
  return ({ cc0: "CC0", pdm: "Public Domain", by: "CC BY", "by-sa": "CC BY-SA" })[value] || value
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""
  } catch {
    return ""
  }
}

function manifestSource(records) {
  return `// Generated by scripts/fetch-style-images.mjs.\n// Run npm run images:refresh to rebuild the complete image atlas.\n\nexport type StyleImageAsset = {\n  file: string\n  alt: string\n  kind: "openverse" | "generated"\n  title: string\n  creator: string\n  sourceUrl: string\n  license: string\n  licenseUrl: string\n}\n\nexport const STYLE_IMAGES: Record<string, StyleImageAsset> = ${JSON.stringify(records, null, 2)}\n`
}

function creditsMarkdown(records) {
  const lines = [
    "# Atlas of Looks image credits",
    "",
    "Images marked as palette studies were generated locally from the corresponding Atlas color data. External images were discovered through Openverse and remain subject to the license linked for each work.",
    "",
  ]
  for (const [id, record] of Object.entries(records)) {
    if (record.kind === "generated") {
      lines.push(`- **${id}** — Atlas-generated palette study.`)
    } else {
      const creator = record.creator || "Unknown creator"
      lines.push(`- **${id}** — [${record.title || "Untitled"}](${record.sourceUrl}) by ${creator}; [${record.license}](${record.licenseUrl || record.sourceUrl}).`)
    }
  }
  return `${lines.join("\n")}\n`
}

async function main() {
  await fs.mkdir(IMAGE_DIR, { recursive: true })
  const styles = await readStyles()
  if (styles.length !== 433) throw new Error(`Expected 433 styles, found ${styles.length}`)
  if (process.argv.includes("--generated-only")) {
    const records = JSON.parse(await fs.readFile(CREDITS_JSON, "utf8"))
    const byId = new Map(styles.map((style) => [style.id, style]))
    const generated = Object.entries(records).filter(([, record]) => record.kind === "generated")
    for (const [id] of generated) await writeGeneratedFallback(byId.get(id))
    console.log(`Rebuilt ${generated.length} generated palette studies.`)
    return
  }
  if (process.argv.includes("--dedupe")) {
    const records = JSON.parse(await fs.readFile(CREDITS_JSON, "utf8"))
    const byId = new Map(styles.map((style) => [style.id, style]))
    const seen = new Map()
    let replaced = 0
    for (const [id, record] of Object.entries(records)) {
      const filePath = path.join(IMAGE_DIR, record.file)
      const bytes = await fs.readFile(filePath)
      const hash = crypto.createHash("sha256").update(bytes).digest("hex")
      if (seen.has(hash)) {
        await fs.unlink(filePath)
        const file = await writeGeneratedFallback(byId.get(id))
        records[id] = {
          file,
          alt: `Abstract palette study for ${byId.get(id).name}`,
          kind: "generated",
          title: `${byId.get(id).name} palette study`,
          creator: "Atlas of Looks",
          sourceUrl: "",
          license: "Original",
          licenseUrl: "",
        }
        replaced += 1
      } else {
        seen.set(hash, id)
        record.sourceUrl = safeHttpUrl(record.sourceUrl)
        record.licenseUrl = safeHttpUrl(record.licenseUrl)
        if (record.kind === "openverse") record.alt = `${byId.get(id).name} visual reference: ${record.title}`
      }
    }
    await fs.writeFile(MANIFEST_FILE, manifestSource(records), "utf8")
    await fs.writeFile(CREDITS_JSON, `${JSON.stringify(records, null, 2)}\n`, "utf8")
    await fs.writeFile(CREDITS_MD, creditsMarkdown(records), "utf8")
    console.log(`Replaced ${replaced} duplicate image${replaced === 1 ? "" : "s"}.`)
    return
  }
  const previousFiles = await fs.readdir(IMAGE_DIR)
  await Promise.all(
    previousFiles
      .filter((file) => /\.(?:jpe?g|png|webp|gif)$/i.test(file))
      .map((file) => fs.unlink(path.join(IMAGE_DIR, file))),
  )
  const records = {}
  let sourced = 0
  let generated = 0
  let cursor = 0
  let completed = 0
  async function processStyle(style) {
    let image = null
    try {
      image = await findOpenImage(style)
    } catch (error) {
      console.warn(`Openverse lookup failed for ${style.id}: ${error.message}`)
    }
    if (image) {
      try {
        const file = await downloadThumbnail(image, style.id)
        records[style.id] = {
          file,
          alt: `Representative image for ${style.name}`,
          kind: "openverse",
          title: image.title || style.name,
          creator: image.creator || "",
          sourceUrl: safeHttpUrl(image.foreign_landing_url || image.detail_url || ""),
          license: licenseLabel(image.license),
          licenseUrl: safeHttpUrl(image.license_url || ""),
        }
        sourced += 1
      } catch (error) {
        console.warn(`Thumbnail failed for ${style.id}: ${error.message}`)
      }
    }
    if (!records[style.id]) {
      const file = await writeGeneratedFallback(style)
      records[style.id] = {
        file,
        alt: `Abstract palette study for ${style.name}`,
        kind: "generated",
        title: `${style.name} palette study`,
        creator: "Atlas of Looks",
        sourceUrl: "",
        license: "Original",
        licenseUrl: "",
      }
      generated += 1
    }
    completed += 1
    if (completed % 10 === 0 || completed === styles.length) {
      console.log(`${completed}/${styles.length} · ${sourced} sourced · ${generated} generated`)
    }
  }
  async function worker() {
    while (cursor < styles.length) {
      const index = cursor
      cursor += 1
      await processStyle(styles[index])
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => worker()))
  const orderedRecords = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b)))
  await fs.writeFile(MANIFEST_FILE, manifestSource(orderedRecords), "utf8")
  await fs.writeFile(CREDITS_JSON, `${JSON.stringify(orderedRecords, null, 2)}\n`, "utf8")
  await fs.writeFile(CREDITS_MD, creditsMarkdown(orderedRecords), "utf8")
  console.log(`Complete: ${Object.keys(orderedRecords).length} images (${sourced} sourced, ${generated} generated).`)
}

await main()
