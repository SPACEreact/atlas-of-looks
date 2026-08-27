import { useEffect, useMemo, useRef, useState } from "react"
import { COLLECTIONS, STYLE_BY_ID, STYLES } from "./data"
import { DEFAULT_SUBJECT, fillSubject } from "./lib/mix"
import { searchStyles } from "./lib/search"
import { loadSaved, loadSubject, saveSaved, saveSubject } from "./lib/storage"
import type { Realm, Style, StyleImage } from "./types"
import { REALMS, REGIONS } from "./types"

type View = "atlas" | "saved"

const CATALOG = new Map(STYLES.map((style, index) => [style.id, String(index + 1).padStart(3, "0")]))

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  textarea.remove()
}

export default function App() {
  const [view, setView] = useState<View>("atlas")
  const [query, setQuery] = useState("")
  const [realm, setRealm] = useState<Realm | "all">("all")
  const [region, setRegion] = useState("all")
  const [collection, setCollection] = useState<string | null>(null)
  const [subject, setSubject] = useState(() => loadSubject() || DEFAULT_SUBJECT)
  const [openId, setOpenId] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>(() => loadSaved())
  const [copied, setCopied] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName
      if (event.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === "Escape") setOpenId(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!openId) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [openId])

  const filtered = useMemo(() => {
    if (collection) {
      const selected = COLLECTIONS.find((item) => item.id === collection)
      const ids = new Set(selected?.ids || [])
      return STYLES.filter((style) => ids.has(style.id))
    }
    return searchStyles(STYLES, query, realm, region)
  }, [query, realm, region, collection])

  const open = openId ? STYLE_BY_ID.get(openId) : undefined
  const savedStyles = saved.map((id) => STYLE_BY_ID.get(id)).filter(Boolean) as Style[]
  const hasFilter = Boolean(query || collection || realm !== "all" || region !== "all")

  function pingCopy(id: string) {
    setCopied(id)
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1400)
  }

  function toggleSave(id: string) {
    setSaved((previous) => {
      const next = previous.includes(id) ? previous.filter((item) => item !== id) : [id, ...previous]
      saveSaved(next)
      return next
    })
  }

  function resetFilters() {
    setQuery("")
    setRealm("all")
    setRegion("all")
    setCollection(null)
    setView("atlas")
  }

  return (
    <div className="app">
      <header className="mast">
        <div className="mast-inner">
          <div className="mast-row">
            <button className="wordmark" onClick={resetFilters} aria-label="Atlas of Looks, full catalogue">
              Atlas of Looks
              <span>A catalogue of visual languages</span>
            </button>
            <div className="mast-meta">
              <span>
                <em>{STYLES.length}</em> plates
              </span>
              <button className={view === "atlas" ? "on" : ""} onClick={() => setView("atlas")}>
                Catalogue
              </button>
              <button className={view === "saved" ? "on" : ""} onClick={() => setView("saved")}>
                Kept {saved.length ? saved.length : ""}
              </button>
            </div>
          </div>

          <div className="search">
            <label htmlFor="atlas-search">Find</label>
            <input
              id="atlas-search"
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setCollection(null)
                setView("atlas")
              }}
              placeholder="a style, culture, film, game, medium, or mood"
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery("")}>
                Clear
              </button>
            )}
          </div>

          <nav className="cats" aria-label="Departments">
            {REALMS.map((item) => (
              <button
                key={item.id}
                className={realm === item.id && !collection ? "on" : ""}
                onClick={() => {
                  setRealm(item.id)
                  if (item.id !== "cultures") setRegion("all")
                  setCollection(null)
                  setView("atlas")
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {realm === "cultures" && (
            <div className="regions" aria-label="Regions">
              <button className={region === "all" ? "on" : ""} onClick={() => setRegion("all")}>
                All regions
              </button>
              {REGIONS.map((item) => (
                <button key={item.id} className={region === item.id ? "on" : ""} onClick={() => setRegion(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="subject">
            <label htmlFor="atlas-subject">Subject</label>
            <input
              id="atlas-subject"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value)
                saveSubject(event.target.value)
              }}
              placeholder={DEFAULT_SUBJECT}
            />
          </div>

          {view === "atlas" && !query && (
            <div className="paths" aria-label="Curated paths">
              {COLLECTIONS.map((item) => (
                <button
                  key={item.id}
                  className={collection === item.id ? "on" : ""}
                  onClick={() => {
                    setCollection(collection === item.id ? null : item.id)
                    setQuery("")
                    setView("atlas")
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="main">
        {view === "atlas" ? (
          <>
            <div className="lede-line">
              <div>
                <strong>{filtered.length}</strong>
                {collection ? ` · ${COLLECTIONS.find((item) => item.id === collection)?.name}` : " plates"}
                {query ? ` · “${query}”` : ""}
              </div>
              <div className="actions">
                {hasFilter && <button onClick={resetFilters}>Reset</button>}
                <button
                  onClick={() => {
                    const style = filtered[Math.floor(Math.random() * filtered.length)]
                    if (style) setOpenId(style.id)
                  }}
                >
                  At random
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <h3>Nothing filed under that.</h3>
                <p>Try a place, medium, studio, title, or mood.</p>
                <button onClick={resetFilters}>Return to the catalogue</button>
              </div>
            ) : (
              <div className="grid">
                {filtered.map((style) => (
                  <Card
                    key={style.id}
                    style={style}
                    saved={saved.includes(style.id)}
                    onOpen={() => setOpenId(style.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="lede-line">
              <div>
                <strong>{savedStyles.length}</strong> kept on this device
              </div>
              <div className="actions">
                <button onClick={() => setView("atlas")}>Catalogue</button>
              </div>
            </div>
            {savedStyles.length === 0 ? (
              <div className="empty">
                <h3>Nothing kept.</h3>
                <p>Open a plate and keep it.</p>
                <button onClick={() => setView("atlas")}>Return to the catalogue</button>
              </div>
            ) : (
              <div className="grid">
                {savedStyles.map((style) => (
                  <Card key={style.id} style={style} saved onOpen={() => setOpenId(style.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="foot">
        <span>Atlas of Looks</span>
        <span>Press / to search</span>
      </footer>

      {open && (
        <Detail
          style={open}
          subject={subject}
          saved={saved.includes(open.id)}
          copied={copied}
          onClose={() => setOpenId(null)}
          onSave={() => toggleSave(open.id)}
          onOpen={(id) => setOpenId(id)}
          pingCopy={pingCopy}
        />
      )}
    </div>
  )
}

function Card({ style, saved, onOpen }: { style: Style; saved: boolean; onOpen: () => void }) {
  return (
    <button className="card" onClick={onOpen} aria-label={`Open ${style.name}`}>
      <span className="card-image">
        <img
          src={style.image.src}
          alt=""
          width="720"
          height="480"
          loading="lazy"
          decoding="async"
        />
        {saved && <span className="kept">Kept</span>}
      </span>
      <span className="no">{CATALOG.get(style.id)}</span>
      <span className="name">{style.name}</span>
      <span className="meta">
        {style.origin} · {style.era}
      </span>
    </button>
  )
}

function ImageCredit({ image }: { image: StyleImage }) {
  if (image.kind === "generated") return <p className="image-credit">Original plate</p>
  return (
    <p className="image-credit">
      Image:{" "}
      <a href={image.sourceUrl} target="_blank" rel="noreferrer">
        {image.title}
      </a>
      {image.creator ? ` · ${image.creator}` : ""}
      {image.licenseUrl ? (
        <>
          {" · "}
          <a href={image.licenseUrl} target="_blank" rel="noreferrer">
            {image.license}
          </a>
        </>
      ) : (
        ` · ${image.license}`
      )}
    </p>
  )
}

function Detail({
  style,
  subject,
  saved,
  copied,
  onClose,
  onSave,
  onOpen,
  pingCopy,
}: {
  style: Style
  subject: string
  saved: boolean
  copied: string | null
  onClose: () => void
  onSave: () => void
  onOpen: (id: string) => void
  pingCopy: (id: string) => void
}) {
  const fullPrompt = fillSubject(style.prompt, subject)
  return (
    <div className="overlay" onClick={onClose}>
      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="sheet-close" onClick={onClose}>
          Close
        </button>
        <div className="detail-image">
          <img src={style.image.src} alt={style.image.alt} width="720" height="480" decoding="async" />
        </div>
        <div className="plate">
          <p className="no">
            Plate {CATALOG.get(style.id)} · {style.realms.join(" · ")}
          </p>
          <h2 id="style-title">{style.name}</h2>
          <p className="sub">
            {style.origin} · {style.era}
            {style.aka.length ? ` · ${style.aka.join(", ")}` : ""}
          </p>
          <ImageCredit image={style.image} />
          <div className="palette" aria-label={`${style.name} palette`}>
            {style.palette.map((color) => (
              <i key={color} style={{ background: color }} title={color} />
            ))}
          </div>
          <div className="acts">
            <button className={copied === "prompt" ? "ok" : ""} onClick={() => copyText(fullPrompt).then(() => pingCopy("prompt"))}>
              {copied === "prompt" ? "Copied" : "Copy prompt"}
            </button>
            <button className={copied === "compact" ? "ok" : ""} onClick={() => copyText(style.compact).then(() => pingCopy("compact"))}>
              {copied === "compact" ? "Copied" : "Compact tags"}
            </button>
            <button onClick={onSave}>{saved ? "Kept" : "Keep"}</button>
          </div>
          <div className="block">
            <h4>What it is</h4>
            <p>{style.summary}</p>
          </div>
          <div className="block">
            <h4>Visual grammar</h4>
            <p>{style.look}</p>
          </div>
          <div className="block">
            <h4>Prompt</h4>
            <pre className="prompt">{fullPrompt}</pre>
          </div>
          <div className="cols">
            <div className="block">
              <h4>Best for</h4>
              <p>{style.bestFor}</p>
            </div>
            <div className="block">
              <h4>Avoid</h4>
              <p>{style.avoid}</p>
            </div>
          </div>
          {style.examples.length > 0 && (
            <div className="block">
              <h4>Touchstones</h4>
              <p>{style.examples.join(" · ")}</p>
            </div>
          )}
          {style.related.length > 0 && (
            <div className="block">
              <h4>Nearby</h4>
              <div className="related">
                {style.related.map((id) => {
                  const related = STYLE_BY_ID.get(id)
                  if (!related) return null
                  return (
                    <button key={id} onClick={() => onOpen(id)}>
                      {related.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
