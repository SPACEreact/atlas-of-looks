import { useEffect, useMemo, useRef, useState } from "react"
import { COLLECTIONS, FEATURED_HEROES, STYLE_BY_ID, STYLES } from "./data"
import { DEFAULT_SUBJECT, fillSubject } from "./lib/mix"
import { searchStyles } from "./lib/search"
import { loadSaved, loadSubject, saveSaved, saveSubject } from "./lib/storage"
import type { Realm, Style, StyleImage } from "./types"
import { REALMS, REGIONS } from "./types"

type View = "atlas" | "saved"

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
  const showHero = view === "atlas" && !query && realm === "all" && !collection && region === "all"
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

  function setSubjectAndSave(value: string) {
    setSubject(value)
    saveSubject(value)
  }

  function showAtlas() {
    setView("atlas")
  }

  function resetFilters() {
    setQuery("")
    setRealm("all")
    setRegion("all")
    setCollection(null)
    showAtlas()
  }

  return (
    <div className="app">
      <div className="grain" aria-hidden="true" />
      <header className="top">
        <div className="brand-row">
          <button className="brand" onClick={resetFilters} aria-label="Open the full Atlas of Looks">
            <h1>
              Atlas of <em>Looks</em>
            </h1>
            <span className="count">{STYLES.length} visual languages</span>
          </button>
          <nav className="nav-views" aria-label="Atlas views">
            <button className={view === "atlas" ? "on" : ""} onClick={showAtlas}>
              Atlas
            </button>
            <button className={view === "saved" ? "on" : ""} onClick={() => setView("saved")}>
              Saved <span>{saved.length}</span>
            </button>
          </nav>
        </div>

        <div className="search-wrap">
          <span className="slash" aria-hidden="true">/</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setCollection(null)
              showAtlas()
            }}
            aria-label="Search all styles"
            placeholder="Search a style, place, medium, studio, game, or mood…"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              Clear
            </button>
          )}
        </div>

        <div className="realms" aria-label="Style categories">
          {REALMS.map((item) => (
            <button
              key={item.id}
              className={realm === item.id && !collection ? "on" : ""}
              aria-pressed={realm === item.id && !collection}
              onClick={() => {
                setRealm(item.id)
                if (item.id !== "cultures") setRegion("all")
                setCollection(null)
                showAtlas()
              }}
              title={item.hint}
            >
              {item.label}
            </button>
          ))}
        </div>

        {realm === "cultures" && (
          <div className="regions" aria-label="Cultural regions">
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

        <div className="subject-row">
          <label htmlFor="atlas-subject">Prompt subject</label>
          <input
            id="atlas-subject"
            value={subject}
            onChange={(event) => setSubjectAndSave(event.target.value)}
            placeholder={DEFAULT_SUBJECT}
          />
          <span>used in every copy-ready prompt</span>
        </div>
      </header>

      <main className="main">
        {view === "atlas" ? (
          <>
            {showHero && (
              <section className="hero">
                <div className="hero-copy">
                  <p className="section-label">A visual field guide</p>
                  <h2>
                    See how every style <em>thinks.</em>
                  </h2>
                  <p className="lede">
                    Four hundred thirty-three visual languages across cultures, art history, film, games, print, photography, the internet, and imagined worlds. Every entry pairs an image with its visual grammar and a prompt you can use.
                  </p>
                  <div className="hero-stat">
                    <strong>433</strong>
                    <span>images · descriptions · palettes · prompts</span>
                  </div>
                </div>
                <div className="mosaic" aria-label="Featured styles">
                  {FEATURED_HEROES.slice(0, 4).map((style, index) => (
                    <button key={style.id} onClick={() => setOpenId(style.id)}>
                      <img
                        src={style.image.src}
                        alt={style.image.alt}
                        width="720"
                        height="480"
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                      />
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {showHero && (
              <section className="collection-section" aria-labelledby="collections-title">
                <p className="section-label" id="collections-title">Curated paths</p>
                <div className="collections">
                  {COLLECTIONS.map((item) => (
                    <button
                      key={item.id}
                      className={collection === item.id ? "on" : ""}
                      onClick={() => {
                        setCollection(collection === item.id ? null : item.id)
                        setQuery("")
                      }}
                    >
                      <strong>{item.name}</strong>
                      <small>{item.hint}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="meta-line">
              <div>
                <strong>{filtered.length}</strong> look{filtered.length === 1 ? "" : "s"}
                {collection ? ` · ${COLLECTIONS.find((item) => item.id === collection)?.name}` : ""}
                {query ? ` · “${query}”` : ""}
              </div>
              <div className="meta-actions">
                {hasFilter && <button onClick={resetFilters}>Reset</button>}
                <button
                  className="btn"
                  onClick={() => {
                    const style = filtered[Math.floor(Math.random() * filtered.length)]
                    if (style) setOpenId(style.id)
                  }}
                >
                  Random look
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <h3>Nothing filed under that.</h3>
                <p>Try a place, medium, artist, studio, title, color, or mood.</p>
                <button className="btn gold" onClick={resetFilters}>Show the full atlas</button>
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
          <section className="saved-view">
            <div className="page-heading">
              <p className="section-label">Your shelf</p>
              <h2>Saved looks</h2>
              <p>Kept on this device for quick return.</p>
            </div>
            {savedStyles.length === 0 ? (
              <div className="empty">
                <h3>Your shelf is empty.</h3>
                <p>Open any style and save it here.</p>
                <button className="btn gold" onClick={showAtlas}>Browse the atlas</button>
              </div>
            ) : (
              <div className="grid">
                {savedStyles.map((style) => (
                  <Card key={style.id} style={style} saved onOpen={() => setOpenId(style.id)} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="foot">
        <span>Atlas of Looks</span>
        <span>433 visual languages · press / to search</span>
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
    <button className={`card ${saved ? "saved" : ""}`} onClick={onOpen} aria-label={`Open ${style.name}`}>
      <span className="card-image">
        <img
          src={style.image.src}
          alt={style.image.alt}
          width="720"
          height="480"
          loading="lazy"
          decoding="async"
        />
        <span className="card-index">{style.realms[0]}</span>
        {saved && <span className="saved-mark" aria-label="Saved">Saved</span>}
      </span>
      <span className="card-body">
        <span className="card-title-row">
          <h3>{style.name}</h3>
          <span aria-hidden="true">↗</span>
        </span>
        <span className="origin">{style.origin} · {style.era}</span>
        <span className="summary">{style.summary}</span>
        <span className="tags">
          {style.tags.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}
        </span>
      </span>
    </button>
  )
}

function ImageCredit({ image }: { image: StyleImage }) {
  if (image.kind === "generated") return <p className="image-credit">Original Atlas image</p>
  return (
    <p className="image-credit">
      Image: <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.title}</a>
      {image.creator ? ` · ${image.creator}` : ""}
      {image.licenseUrl ? (
        <> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a></>
      ) : ` · ${image.license}`}
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
        <button className="sheet-close" onClick={onClose} aria-label="Close style details">Close</button>
        <div className="detail-image">
          <img src={style.image.src} alt={style.image.alt} width="720" height="480" decoding="async" />
        </div>
        <ImageCredit image={style.image} />
        <p className="section-label">{style.realms.join(" · ")}</p>
        <h2 id="style-title">{style.name}</h2>
        <p className="sub">
          {style.origin} · {style.era}
          {style.aka.length ? ` · also ${style.aka.join(", ")}` : ""}
        </p>
        <div className="palette" aria-label={`${style.name} color palette`}>
          {style.palette.map((color) => <i key={color} style={{ background: color }} title={color} />)}
        </div>
        <div className="actions">
          <button
            className={`btn gold ${copied === "prompt" ? "ok" : ""}`}
            onClick={() => copyText(fullPrompt).then(() => pingCopy("prompt"))}
          >
            {copied === "prompt" ? "Copied prompt" : "Copy prompt"}
          </button>
          <button
            className={`btn ${copied === "compact" ? "ok" : ""}`}
            onClick={() => copyText(style.compact).then(() => pingCopy("compact"))}
          >
            {copied === "compact" ? "Copied" : "Copy compact"}
          </button>
          <button className={`btn ${saved ? "gold" : ""}`} onClick={onSave}>
            {saved ? "Saved" : "Save look"}
          </button>
        </div>
        <div className="detail-grid">
          <div className="block">
            <h4>What it is</h4>
            <p>{style.summary}</p>
          </div>
          <div className="block">
            <h4>Visual DNA</h4>
            <p>{style.look}</p>
          </div>
        </div>
        <div className="block">
          <h4>Prompt</h4>
          <pre className="prompt">{fullPrompt}</pre>
        </div>
        <div className="detail-grid">
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
            <h4>Nearby in the atlas</h4>
            <div className="related">
              {style.related.map((id) => {
                const related = STYLE_BY_ID.get(id)
                if (!related) return null
                return <button key={id} onClick={() => onOpen(id)}>{related.name}</button>
              })}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
