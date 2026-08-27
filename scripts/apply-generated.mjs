import fs from "node:fs"
import path from "node:path"

const mappingPath = process.argv[2]
if (!mappingPath) {
  console.error("Usage: node scripts/apply-generated.mjs mapping.json")
  process.exit(1)
}

const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"))
const creditsPath = "public/style-images/credits.json"
const credits = JSON.parse(fs.readFileSync(creditsPath, "utf8"))
const outDir = "public/style-images"

for (const { id, name, src } of mapping) {
  if (!fs.existsSync(src)) throw new Error(`Missing source ${src}`)
  const destName = `${id}.jpg`
  const dest = path.join(outDir, destName)
  const old = credits[id]?.file
  fs.copyFileSync(src, dest)
  if (old && old !== destName) {
    const oldPath = path.join(outDir, old)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }
  credits[id] = {
    file: destName,
    alt: `Original Atlas visual specimen for ${name || id}`,
    kind: "generated",
    title: `${name || id} — original Atlas specimen`,
    creator: "Atlas of Looks",
    sourceUrl: "",
    license: "Original",
    licenseUrl: "",
  }
  console.log(id, "<-", path.basename(src), fs.statSync(dest).size)
}

fs.writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`)
console.log("updated", mapping.length, "credits")
