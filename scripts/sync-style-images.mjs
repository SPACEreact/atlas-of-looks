import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const IMAGE_DIR = path.join(ROOT, "public", "style-images")
const CREDITS_FILE = path.join(IMAGE_DIR, "credits.json")
const MANIFEST_FILE = path.join(ROOT, "src", "data", "style-images.ts")
const ATTRIBUTION_FILE = path.join(IMAGE_DIR, "ATTRIBUTION.md")

const credits = JSON.parse(await fs.readFile(CREDITS_FILE, "utf8"))
const ordered = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)))

if (Object.keys(ordered).length !== 433) {
  throw new Error(`Expected 433 image records, found ${Object.keys(ordered).length}`)
}

const manifest = `// Generated from public/style-images/credits.json.\n` +
  `// Keep every entry paired with its repository-local image file.\n\n` +
  `export type StyleImageAsset = {\n` +
  `  file: string\n  alt: string\n  kind: "openverse" | "generated"\n` +
  `  title: string\n  creator: string\n  sourceUrl: string\n` +
  `  license: string\n  licenseUrl: string\n}\n\n` +
  `export const STYLE_IMAGES: Record<string, StyleImageAsset> = ${JSON.stringify(ordered, null, 2)}\n`
await fs.writeFile(MANIFEST_FILE, manifest)

const sourced = Object.entries(ordered).filter(([, image]) => image.kind === "openverse")
const lines = [
  "# Atlas of Looks — image attribution",
  "",
  "Images labeled Original were created for Atlas of Looks. Sourced images are listed below with their source and license.",
  "",
  "| Style ID | Image | Creator | License |",
  "| --- | --- | --- | --- |",
]

for (const [id, image] of sourced) {
  const title = image.sourceUrl ? `[${image.title}](${image.sourceUrl})` : image.title
  const license = image.licenseUrl ? `[${image.license}](${image.licenseUrl})` : image.license
  lines.push(`| ${id} | ${title.replaceAll("|", "\\|")} | ${(image.creator || "Unknown").replaceAll("|", "\\|")} | ${license} |`)
}

await fs.writeFile(ATTRIBUTION_FILE, `${lines.join("\n")}\n`)
console.log(`Synced ${Object.keys(ordered).length} image records and ${sourced.length} source credits`)
