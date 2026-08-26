import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { COLLECTIONS, FEATURED_HEROES, STYLE_BY_ID, STYLES } from "./data"
import { apiStatus, forgeLocal, forgeRemote, type Forged } from "./lib/forge"
import { DEFAULT_SUBJECT, fillSubject, mixCompact, mixPrompt } from "./lib/mix"
import { searchStyles } from "./lib/search"
import { loadSaved, loadSubject, saveForged, saveSaved, saveSubject, loadForged } from "./lib/storage"
import type { Realm, Style } from "./types"
import { REALMS, REGIONS } from "./types"

type View = "atlas" | "mixer" | "forge" | "saved"

function hashHue(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) % 360
}

function swatchStyle(s: Style): CSSProperties {
  const p = s.palette
  const ang = 32 + (hashHue(s.id) % 80)
  if (p.length >= 3) {
    return {
      background: `linear-gradient(${ang}deg, ${p[0]} 0%, ${p[1]} 42%, ${p[2]} 72%, ${p[p.length - 1]} 100%)`,
    }
  }
  return { background: p[0] || "#222" }
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text)
}

export default function App() {
  const [view, setView] = useState<View>("atlas")
  const [query, setQuery] = useState("")
  const [realm, setRealm] = useState<Realm | "all">("all")
  const [region, setRegion] = useState<string>("all")
  const [collection, setCollection] = useState<string | null>(null)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [openId, setOpenId] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [mix, setMix] = useState<(string | null)[]>([null, null, null])
  const [dream, setDream] = useState("")
  const [forged, setForged] = useState<Forged | null>(null)
  const [forgedList, setForgedList] = useState<Forged[]>([])
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [api, setApi] = useState({ forge: false, imagine: false })
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSaved(loadSaved())
    const s = loadSubject()
    if (s) setSubject(s)
    setForgedList(loadForged<Forged>())
    apiStatus().then(setApi)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape") setOpenId(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filtered = useMemo(() => {
    if (collection) {
      const col = COLLECTIONS.find((c) => c.id === collection)
      const ids = new Set(col?.ids || [])
      return STYLES.filter((s) => ids.has(s.id))
    }
    return searchStyles(STYLES, query, realm, region)
  }, [query, realm, region, collection])

  const open = openId ? STYLE_BY_ID.get(openId) : undefined
  const showHero = view === "atlas" && !query && realm === "all" && !collection && region === "all"

  function pingCopy(id: string) {
    setCopied(id)
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400)
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      saveSaved(next)
      return next
    })
  }

  function setSub(v: string) {
    setSubject(v)
    saveSubject(v)
  }

  function addToMix(id: string) {
    setMix((prev) => {
      const i = prev.findIndex((x) => !x)
      if (i < 0) return [prev[1], prev[2], id]
      const next = [...prev]
      next[i] = id
      return next
    })
    setView("mixer")
  }

  async function runForge(useApi: boolean) {
    if (!dream.trim()) return
    setBusy(true)
    try {
      const card = useApi ? await forgeRemote(dream, STYLES) : forgeLocal(dream, STYLES)
      setForged(card)
      const next = [card, ...forgedList].slice(0, 40)
      setForgedList(next)
      saveForged(next)
    } catch (e) {
      setForged(forgeLocal(dream, STYLES))
      console.warn(e)
    } finally {
      setBusy(false)
    }
  }

  const mixStyles = mix.map((id) => (id ? STYLE_BY_ID.get(id) : undefined)).filter(Boolean) as Style[]

  return (
    <div className="app">
      <div className="grain" />
      <header className="top">
        <div className="brand-row">
          <div className="brand">
            <h1>
              Atlas of <em>Looks</em>
            </h1>
            <span className="count">{STYLES.length} languages</span>
          </div>
          <nav className="nav-views">
            {(["atlas", "mixer", "forge", "saved"] as View[]).map((v) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
                {v === "atlas" ? "Atlas" : v === "mixer" ? "Mixer" : v === "forge" ? "Dream forge" : `Saved ${saved.length ? saved.length : ""}`}
              </button>
            ))}
          </nav>
        </div>
        <div className="search-wrap">
          <span className="slash">/</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCollection(null)
              setView("atlas")
            }}
            placeholder="ukiyo-e, ghibli, bloodborne, madhubani, a wet glass city in a childhood fever…"
          />
        </div>
        <div className="realms">
          {REALMS.map((r) => (
            <button
              key={r.id}
              className={realm === r.id && !collection ? "on" : ""}
              onClick={() => {
                setRealm(r.id)
                setCollection(null)
                setView("atlas")
              }}
              title={r.hint}
            >
              {r.label}
            </button>
          ))}
        </div>
        {realm === "cultures" && (
          <div className="chips realms">
            <button className={region === "all" ? "on" : ""} onClick={() => setRegion("all")}>
              All regions
            </button>
            {REGIONS.map((r) => (
              <button key={r.id} className={region === r.id ? "on" : ""} onClick={() => setRegion(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        )}
        <div className="subject-row">
          <label>Subject</label>
          <input
            value={subject}
            onChange={(e) => setSub(e.target.value)}
            placeholder={DEFAULT_SUBJECT}
          />
          <span className="mono" style={{ fontSize: 10, color: "var(--dim)" }}>
            fills every prompt
          </span>
        </div>
      </header>

      <main className="main">
        {view === "atlas" && (
          <>
            {showHero && (
              <section className="hero">
                <div className="hero-copy">
                  <p className="section-label">The archive</p>
                  <h2>
                    Every look that ever existed. <em>And some that only exist when you close your eyes.</em>
                  </h2>
                  <p className="lede">
                    Cultures, movements, mediums, cinema, animation studios, games, print, photography, the internet, and a wing of invented dreams. Each card is a complete visual grammar plus a copy-ready prompt. Mix two. Invent a third.
                  </p>
                </div>
                <div className="mosaic">
                  {FEATURED_HEROES.slice(0, 4).map((s) => (
                    <button key={s.id} onClick={() => setOpenId(s.id)}>
                      <img src={s.hero} alt="" />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {showHero && (
              <>
                <p className="section-label">Collections</p>
                <div className="collections">
                  {COLLECTIONS.map((c) => (
                    <button
                      key={c.id}
                      className={collection === c.id ? "on" : ""}
                      onClick={() => {
                        setCollection(collection === c.id ? null : c.id)
                        setQuery("")
                      }}
                    >
                      <strong>{c.name}</strong>
                      <small>{c.hint}</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="meta-line">
              <span>
                {filtered.length} look{filtered.length === 1 ? "" : "s"}
                {collection ? ` · ${COLLECTIONS.find((c) => c.id === collection)?.name}` : ""}
                {query ? ` · “${query}”` : ""}
              </span>
              <button
                className="btn"
                onClick={() => {
                  const s = filtered[Math.floor(Math.random() * filtered.length)]
                  if (s) setOpenId(s.id)
                }}
              >
                Random
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <h3>Nothing filed under that.</h3>
                <p>
                  Invent it in the Dream forge — describe a culture, a studio, a game, a movie, or a dream, and we’ll write the style.
                </p>
                <div className="actions">
                  <button
                    className="btn gold"
                    onClick={() => {
                      setDream(query)
                      setView("forge")
                    }}
                  >
                    Forge this
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid">
                {filtered.map((s) => (
                  <Card
                    key={s.id}
                    s={s}
                    saved={saved.includes(s.id)}
                    onOpen={() => setOpenId(s.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === "mixer" && (
          <section className="mixer">
            <p className="section-label">Hybrid</p>
            <h2 className="serif" style={{ fontSize: 42, fontWeight: 400, letterSpacing: "-0.03em" }}>
              Mix looks
            </h2>
            <p className="lede" style={{ margin: "8px 0 4px" }}>
              First style owns space and light. Second stains the surface. Third is an accent. Open any card and hit Mix.
            </p>
            <div className="slots">
              {mix.map((id, i) => {
                const s = id ? STYLE_BY_ID.get(id) : undefined
                return (
                  <button
                    key={i}
                    className={`slot ${s ? "on" : ""}`}
                    onClick={() => s && setOpenId(s.id)}
                  >
                    <small>{i === 0 ? "Dominant" : i === 1 ? "Pigment" : "Accent"}</small>
                    <h3>{s ? s.name : "Empty"}</h3>
                    {s && <p className="origin">{s.origin}</p>}
                    {s && (
                      <span
                        className="btn"
                        style={{ marginTop: 10, display: "inline-block" }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMix((prev) => prev.map((x, j) => (j === i ? null : x)))
                        }}
                      >
                        Clear
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {mixStyles.length > 0 && (
              <>
                <div className="actions">
                  <button
                    className={`btn gold ${copied === "mix" ? "ok" : ""}`}
                    onClick={() => {
                      copyText(mixPrompt(mixStyles, subject)).then(() => pingCopy("mix"))
                    }}
                  >
                    {copied === "mix" ? "Copied" : "Copy hybrid prompt"}
                  </button>
                  <button
                    className={`btn ${copied === "mixc" ? "ok" : ""}`}
                    onClick={() => {
                      copyText(mixCompact(mixStyles)).then(() => pingCopy("mixc"))
                    }}
                  >
                    Compact tags
                  </button>
                </div>
                <div className="block">
                  <h4>Hybrid prompt</h4>
                  <pre className="prompt">{mixPrompt(mixStyles, subject)}</pre>
                </div>
              </>
            )}
            <p className="section-label">Add from the atlas</p>
            <div className="grid">
              {STYLES.slice(0, 24).map((s) => (
                <Card key={s.id} s={s} saved={saved.includes(s.id)} onOpen={() => setOpenId(s.id)} />
              ))}
            </div>
          </section>
        )}

        {view === "forge" && (
          <section className="forge">
            <p className="section-label">Invented wing</p>
            <h2 className="serif" style={{ fontSize: 42, fontWeight: 400, letterSpacing: "-0.03em" }}>
              Dream forge
            </h2>
            <p className="lede" style={{ margin: "8px 0 14px" }}>
              Describe anything: a culture that never met, a studio that doesn’t exist, the way light looked in a fever in 1998, a game you played in a dream. We’ll write a full style bible and a prompt.
              {api.forge ? " SpaceXAI is on — richer inventions." : " Works offline. Add XAI_API_KEY in .env for SpaceXAI."}
            </p>
            <textarea
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder="A city of wet glass and childhood bedrooms, like a fever in monsoon India, analog video, toys the size of temples…"
            />
            <div className="actions">
              <button className="btn gold" disabled={busy} onClick={() => runForge(false)}>
                {busy ? "Forging…" : "Forge locally"}
              </button>
              <button className="btn" disabled={busy || !api.forge} onClick={() => runForge(true)}>
                Forge with SpaceXAI
              </button>
            </div>
            {forged && <ForgedCard card={forged} subject={subject} copied={copied} pingCopy={pingCopy} />}
            {forgedList.length > 1 && (
              <>
                <p className="section-label">Recent inventions</p>
                {forgedList.slice(1, 8).map((c) => (
                  <button
                    key={c.id}
                    className="btn"
                    style={{ marginRight: 8, marginBottom: 8 }}
                    onClick={() => setForged(c)}
                  >
                    {c.name}
                  </button>
                ))}
              </>
            )}
          </section>
        )}

        {view === "saved" && (
          <section>
            <p className="section-label">Kept</p>
            <h2 className="serif" style={{ fontSize: 42, fontWeight: 400, letterSpacing: "-0.03em" }}>
              Saved looks
            </h2>
            {saved.length === 0 ? (
              <div className="empty saved-empty">
                <h3>Nothing pinned yet.</h3>
                <p>Open a look and hit Save. They live in this browser.</p>
              </div>
            ) : (
              <div className="grid" style={{ marginTop: 16 }}>
                {saved
                  .map((id) => STYLE_BY_ID.get(id))
                  .filter(Boolean)
                  .map((s) => (
                    <Card key={s!.id} s={s!} saved onOpen={() => setOpenId(s!.id)} />
                  ))}
              </div>
            )}
          </section>
        )}
      </main>

      <p className="foot">
        Atlas of Looks · copy a prompt, mix two, invent a third · press / to search
      </p>

      {open && (
        <Detail
          s={open}
          subject={subject}
          saved={saved.includes(open.id)}
          copied={copied}
          onClose={() => setOpenId(null)}
          onSave={() => toggleSave(open.id)}
          onMix={() => addToMix(open.id)}
          onOpen={(id) => setOpenId(id)}
          pingCopy={pingCopy}
        />
      )}
    </div>
  )
}

function Card({ s, saved, onOpen }: { s: Style; saved: boolean; onOpen: () => void }) {
  return (
    <button className={`card ${saved ? "saved" : ""}`} onClick={onOpen}>
      <div className="swatch" style={s.hero ? undefined : swatchStyle(s)}>
        {s.hero && <img src={s.hero} alt="" />}
      </div>
      <div className="card-body">
        <h3>{s.name}</h3>
        <div className="origin">
          {s.origin} · {s.era}
        </div>
        <p>{s.summary}</p>
        <div className="tags">
          {s.tags.slice(0, 4).map((t) => (
            <i key={t}>{t}</i>
          ))}
        </div>
      </div>
    </button>
  )
}

function Detail({
  s,
  subject,
  saved,
  copied,
  onClose,
  onSave,
  onMix,
  onOpen,
  pingCopy,
}: {
  s: Style
  subject: string
  saved: boolean
  copied: string | null
  onClose: () => void
  onSave: () => void
  onMix: () => void
  onOpen: (id: string) => void
  pingCopy: (id: string) => void
}) {
  const full = fillSubject(s.prompt, subject)
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="sheet" onClick={(e) => e.stopPropagation()}>
        {s.hero && <img className="hero-img" src={s.hero} alt="" />}
        <p className="section-label">{s.realms.join(" · ")}</p>
        <h2>{s.name}</h2>
        <p className="sub">
          {s.origin} · {s.era}
          {s.aka.length ? ` · also ${s.aka.join(", ")}` : ""}
        </p>
        <div className="palette">
          {s.palette.map((c) => (
            <i key={c} style={{ background: c }} title={c} />
          ))}
        </div>
        <div className="actions">
          <button
            className={`btn gold ${copied === "p" ? "ok" : ""}`}
            onClick={() => copyText(full).then(() => pingCopy("p"))}
          >
            {copied === "p" ? "Copied prompt" : "Copy prompt"}
          </button>
          <button
            className={`btn ${copied === "c" ? "ok" : ""}`}
            onClick={() => copyText(s.compact).then(() => pingCopy("c"))}
          >
            Compact
          </button>
          <button className="btn" onClick={onMix}>
            Mix
          </button>
          <button className={`btn ${saved ? "gold" : ""}`} onClick={onSave}>
            {saved ? "Saved" : "Save"}
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="block">
          <h4>What it is</h4>
          <p>{s.summary}</p>
        </div>
        <div className="block">
          <h4>Visual DNA</h4>
          <p>{s.look}</p>
        </div>
        <div className="block">
          <h4>Prompt</h4>
          <pre className="prompt">{full}</pre>
        </div>
        <div className="block">
          <h4>Best for</h4>
          <p>{s.bestFor}</p>
        </div>
        <div className="block">
          <h4>Avoid</h4>
          <p>{s.avoid}</p>
        </div>
        {s.examples.length > 0 && (
          <div className="block">
            <h4>Touchstones</h4>
            <p>{s.examples.join(" · ")}</p>
          </div>
        )}
        {s.related.length > 0 && (
          <div className="block">
            <h4>Nearby</h4>
            <div className="related">
              {s.related.map((id) => {
                const r = STYLE_BY_ID.get(id)
                if (!r) return null
                return (
                  <button key={id} onClick={() => onOpen(id)}>
                    {r.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function ForgedCard({
  card,
  subject,
  copied,
  pingCopy,
}: {
  card: Forged
  subject: string
  copied: string | null
  pingCopy: (id: string) => void
}) {
  const full = fillSubject(card.prompt, subject)
  return (
    <div className="forged">
      <p className="section-label">{card.source === "spacexai" ? "SpaceXAI invention" : "Local invention"}</p>
      <h2 className="serif" style={{ fontSize: 32, fontWeight: 400 }}>
        {card.name}
      </h2>
      <p className="sub">
        {card.origin} · {card.era}
      </p>
      <div className="palette">
        {card.palette.map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
      </div>
      <div className="actions">
        <button className={`btn gold ${copied === "f" ? "ok" : ""}`} onClick={() => copyText(full).then(() => pingCopy("f"))}>
          {copied === "f" ? "Copied" : "Copy prompt"}
        </button>
        <button className={`btn ${copied === "fc" ? "ok" : ""}`} onClick={() => copyText(card.compact).then(() => pingCopy("fc"))}>
          Compact
        </button>
      </div>
      <div className="block">
        <h4>Visual DNA</h4>
        <p>{card.look}</p>
      </div>
      <div className="block">
        <h4>Prompt</h4>
        <pre className="prompt">{full}</pre>
      </div>
      {card.cousins.length > 0 && (
        <div className="block">
          <h4>Cousins in the archive</h4>
          <p>{card.cousins.map((c) => c.name).join(" · ")}</p>
        </div>
      )}
    </div>
  )
}
