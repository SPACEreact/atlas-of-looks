import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const IMAGE_DIR = path.join(ROOT, "public", "style-images")
const CREDITS_FILE = path.join(IMAGE_DIR, "credits.json")
const IMAGE_PATTERN = /\.(?:jpe?g|png|webp|gif)$/i

const records = JSON.parse(await fs.readFile(CREDITS_FILE, "utf8"))
const entries = Object.entries(records)
if (entries.length !== 433) throw new Error(`Expected 433 manifest entries, found ${entries.length}`)

const files = (await fs.readdir(IMAGE_DIR)).filter((file) => IMAGE_PATTERN.test(file)).sort()
if (files.length !== 433) throw new Error(`Expected 433 image files, found ${files.length}`)

const expectedFiles = new Set(entries.map(([, record]) => record.file))
const orphaned = files.filter((file) => !expectedFiles.has(file))
if (orphaned.length) throw new Error(`Orphaned image files: ${orphaned.join(", ")}`)

const hashes = new Map()
let totalBytes = 0
let sourced = 0
let generated = 0
for (const [id, record] of entries) {
  const filePath = path.join(IMAGE_DIR, record.file)
  const bytes = await fs.readFile(filePath)
  if (bytes.length < 2_000) throw new Error(`${id} image is unexpectedly small (${bytes.length} bytes)`)
  totalBytes += bytes.length
  if (record.kind === "openverse") sourced += 1
  if (record.kind === "generated") generated += 1
  const hash = crypto.createHash("sha256").update(bytes).digest("hex")
  const previous = hashes.get(hash) || []
  previous.push(id)
  hashes.set(hash, previous)
}

const duplicates = [...hashes.values()].filter((ids) => ids.length > 1)
if (duplicates.length) console.warn(`Duplicate image groups: ${duplicates.map((ids) => ids.join("/")).join(", ")}`)

console.log(
  `Validated 433 images · ${sourced} sourced · ${generated} palette studies · ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`,
)
