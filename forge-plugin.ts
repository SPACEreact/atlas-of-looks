import type { IncomingMessage, ServerResponse } from "node:http"
import { loadEnv, type Plugin } from "vite"

function key() {
  return (process.env.XAI_API_KEY || "").trim()
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (c) => chunks.push(Buffer.from(c)))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function send(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

async function handleForge(req: IncomingMessage, res: ServerResponse) {
  const k = key()
  if (!k) {
    send(res, 501, { error: "No XAI_API_KEY. Local forge still works." })
    return
  }
  const raw = await readBody(req)
  const { description, cousins } = JSON.parse(raw) as {
    description: string
    cousins?: { name: string; look: string; era: string }[]
  }
  const cousinBlock = (cousins || [])
    .slice(0, 8)
    .map((c) => `- ${c.name} (${c.era}): ${c.look}`)
    .join("\n")
  const prompt = `Invent a complete visual art style from this description. Not a scene — a STYLE SYSTEM (line, light, pigment, space, texture, rules).

Description:
${description}

Distant cousins in an archive (steal grammar, not costume):
${cousinBlock || "(none)"}

Return ONLY JSON with keys:
name, era, origin, summary, look, palette (array of 4-6 hex colors), prompt (one paragraph ready for an image model, include the placeholder {subject}), compact (comma tags), avoid, bestFor.
The prompt must be executable and specific. Do not mention AI. Do not copy a living studio brand wholesale.`

  const r = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4.6",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content:
            "You invent visual languages. You write like a museum label that can also drive an image model. JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  })
  if (!r.ok) {
    send(res, 502, { error: await r.text() })
    return
  }
  const data = (await r.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content || ""
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start < 0 || end < 0) {
    send(res, 502, { error: "No JSON in model output", text })
    return
  }
  const parsed = JSON.parse(text.slice(start, end + 1))
  send(res, 200, parsed)
}

export function forgePlugin(): Plugin {
  return {
    name: "atlas-forge",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir || process.cwd(), "")
      if (env.XAI_API_KEY) process.env.XAI_API_KEY = env.XAI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()
        try {
          if (req.url === "/api/status" && req.method === "GET") {
            send(res, 200, { forge: Boolean(key()), imagine: Boolean(key()) })
            return
          }
          if (req.url === "/api/forge" && req.method === "POST") {
            await handleForge(req, res)
            return
          }
        } catch (e) {
          send(res, 500, { error: e instanceof Error ? e.message : "error" })
          return
        }
        next()
      })
    },
  }
}
