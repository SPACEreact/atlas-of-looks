import fs from "node:fs"
import path from "node:path"

const credits = JSON.parse(fs.readFileSync("public/style-images/credits.json", "utf8"))
const media = JSON.parse(fs.readFileSync("handoff/media-design.json", "utf8"))
const dir = "src/data"
const styles = {}
const re =
  /\{ id: "([^"]+)", name: "([^"]+)",[\s\S]*?era: "([^"]+)", origin: "([^"]+)"[\s\S]*?look: "([^"]+)", palette: "([^"]+)"/g

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".ts") || ["index.ts", "compile.ts", "style-images.ts"].includes(file)) continue
  const text = fs.readFileSync(path.join(dir, file), "utf8")
  let m
  while ((m = re.exec(text))) {
    styles[m[1]] = { id: m[1], name: m[2], era: m[3], origin: m[4], look: m[5], palette: m[6] }
  }
}

const studies = Object.entries(credits)
  .filter(([, c]) => /palette study|Abstract palette/i.test(`${c.alt}${c.title}`))
  .map(([id]) => id)

const queue = []
for (const id of studies) {
  const s = styles[id]
  const brief = media.items?.[id]?.recommended?.generationBrief
  const prompt = brief
    ? brief
    : s
      ? `A finished original landscape scene in the authentic visual language of ${s.name} (${s.era}, ${s.origin}). ${s.look} Color world: ${s.palette}. Coherent single scene, edge-to-edge artwork.`
      : `A finished original landscape scene demonstrating the visual style ${id}. Coherent single scene, edge-to-edge artwork.`
  queue.push({ id, name: s?.name || id, prompt })
}

fs.writeFileSync("handoff/gen-queue.json", JSON.stringify(queue, null, 2))
console.log("parsed", Object.keys(styles).length, "queue", queue.length)
console.log(queue.slice(0, 12).map((x) => x.id).join(", "))
