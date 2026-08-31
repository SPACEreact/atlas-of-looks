import { useEffect, useMemo, useRef, useState } from "react";

import { COLLECTIONS, STYLE_BY_ID, STYLES } from "./data";
import { DEFAULT_SUBJECT, fillSubject } from "./lib/mix";
import { searchStyles } from "./lib/search";
import {
  loadSaved,
  loadSubject,
  saveSaved,
  saveSubject,
} from "./lib/storage";
import type { Realm, Style, StyleImage } from "./types";
import { REALMS, REGIONS } from "./types";

type View = "atlas" | "saved";
type LensId =
  | "all"
  | "heritage"
  | "movements"
  | "making"
  | "storyworlds"
  | "synthetic";
type EpochId = "all" | "origins" | "sacred" | "early" | "modern" | "mass" | "networked";

type Lens = {
  id: Exclude<LensId, "all">;
  index: string;
  label: string;
  short: string;
  description: string;
  sampleId: string;
};

const LENSES: Lens[] = [
  {
    id: "heritage",
    index: "01",
    label: "Heritage",
    short: "Ritual, place, inheritance",
    description: "Civilizations, sacred traditions and living regional languages.",
    sampleId: "cave-art",
  },
  {
    id: "movements",
    index: "02",
    label: "Movements",
    short: "Ideas that changed the image",
    description: "Schools and revolutions from classical order to contemporary art.",
    sampleId: "caravaggio",
  },
  {
    id: "making",
    index: "03",
    label: "Making",
    short: "Matter, mark, process",
    description: "Pigment, print, lens, paper, textile and digital craft.",
    sampleId: "cyanotype",
  },
  {
    id: "storyworlds",
    index: "04",
    label: "Storyworlds",
    short: "Images that move and play",
    description: "Cinema, animation, comics and interactive worlds.",
    sampleId: "ghibli",
  },
  {
    id: "synthetic",
    index: "05",
    label: "Digital & imagined",
    short: "Networks, dreams, futures",
    description: "Internet aesthetics, computational images and invented visual systems.",
    sampleId: "dream-crt",
  },
];

const EPOCHS: { id: Exclude<EpochId, "all">; label: string; range: string }[] = [
  { id: "origins", label: "Origins", range: "40,000 BCE–500" },
  { id: "sacred", label: "Sacred worlds", range: "500–1400" },
  { id: "early", label: "Early modern", range: "1400–1780" },
  { id: "modern", label: "Revolutions", range: "1780–1945" },
  { id: "mass", label: "Mass culture", range: "1945–2000" },
  { id: "networked", label: "Networked & AI", range: "2000–now" },
];

const SUB_REALMS: Partial<Record<LensId, Realm[]>> = {
  making: ["mediums", "photo"],
  storyworlds: ["cinema", "animation", "comics", "games"],
  synthetic: ["digital", "dreams"],
};

const CATALOG = new Map(
  STYLES.map((style, index) => [style.id, String(index + 1).padStart(3, "0")]),
);

function lensFor(style: Style): Exclude<LensId, "all"> {
  if (style.realms.includes("cultures")) return "heritage";
  if (style.realms.includes("history")) return "movements";
  if (style.realms.includes("mediums") || style.realms.includes("photo")) return "making";
  if (
    style.realms.includes("cinema") ||
    style.realms.includes("animation") ||
    style.realms.includes("comics") ||
    style.realms.includes("games")
  ) {
    return "storyworlds";
  }
  return "synthetic";
}

function estimatedYear(style: Style): number | null {
  const era = style.era.toLowerCase().replaceAll(",", "");
  if (era.includes("invented") || era.includes("dream")) return 2025;
  if (era.includes("prehistoric")) return -20000;

  const bceSpan = era.match(/(\d{1,5})\s*[–-]\s*(\d{1,5})\s*bce/);
  if (bceSpan) return -Math.max(Number(bceSpan[1]), Number(bceSpan[2]));

  const bceCentury = era.match(/(\d{1,2})(?:st|nd|rd|th)\s*c\.?\s*bce/);
  if (bceCentury) return -(Number(bceCentury[1]) - 1) * 100 - 50;

  const directBce = era.match(/(\d{1,5})\s*bce/);
  if (directBce) return -Number(directBce[1]);

  const year = era.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (year) return Number(year[1]);

  const century = era.match(/(\d{1,2})(?:st|nd|rd|th)\s*c\.?/);
  if (century) return (Number(century[1]) - 1) * 100 + 50;

  if (era.includes("antiquity")) return 100;
  if (era.includes("medieval")) return 1100;
  if (era.includes("renaissance")) return 1500;
  if (era.includes("modern")) return 1900;
  if (era.includes("now")) return 2020;
  return null;
}

function epochFor(style: Style): Exclude<EpochId, "all"> | null {
  const year = estimatedYear(style);
  if (year === null) return null;
  if (year < 500) return "origins";
  if (year < 1400) return "sacred";
  if (year < 1780) return "early";
  if (year < 1945) return "modern";
  if (year < 2000) return "mass";
  return "networked";
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function App() {
  const [view, setView] = useState<View>("atlas");
  const [query, setQuery] = useState("");
  const [lens, setLens] = useState<LensId>("all");
  const [epoch, setEpoch] = useState<EpochId>("all");
  const [subRealm, setSubRealm] = useState<Realm | null>(null);
  const [region, setRegion] = useState("all");
  const [collection, setCollection] = useState<string | null>(null);
  const [subject, setSubject] = useState(() => loadSubject() || DEFAULT_SUBJECT);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>(() => loadSaved());
  const [copied, setCopied] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key === "k")) && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openId]);

  const lensCounts = useMemo(() => {
    const counts = new Map<Exclude<LensId, "all">, number>();
    for (const item of LENSES) counts.set(item.id, 0);
    for (const style of STYLES) {
      const id = lensFor(style);
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }, []);

  const epochCounts = useMemo(() => {
    const counts = new Map<Exclude<EpochId, "all">, number>();
    for (const item of EPOCHS) counts.set(item.id, 0);
    for (const style of STYLES) {
      const id = epochFor(style);
      if (id) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let list = view === "saved"
      ? saved.map((id) => STYLE_BY_ID.get(id)).filter(Boolean) as Style[]
      : STYLES;

    if (collection && view === "atlas") {
      const selected = COLLECTIONS.find((item) => item.id === collection);
      const ids = new Set(selected?.ids || []);
      list = list.filter((style) => ids.has(style.id));
    } else if (view === "atlas") {
      if (lens !== "all") list = list.filter((style) => lensFor(style) === lens);
      if (epoch !== "all") list = list.filter((style) => epochFor(style) === epoch);
      if (subRealm) list = list.filter((style) => style.realms.includes(subRealm));
      if (lens === "heritage" && region !== "all") {
        list = list.filter((style) => style.region === region);
      }
    }

    return query ? searchStyles(list, query, "all", "all") : list;
  }, [collection, epoch, lens, query, region, saved, subRealm, view]);

  const open = openId ? STYLE_BY_ID.get(openId) : undefined;
  const hasFilter = Boolean(
    query || collection || lens !== "all" || epoch !== "all" || subRealm || region !== "all",
  );
  const activeLens = LENSES.find((item) => item.id === lens);
  const activeEpoch = EPOCHS.find((item) => item.id === epoch);

  function pingCopy(id: string) {
    setCopied(id);
    window.setTimeout(() => {
      setCopied((current) => (current === id ? null : current));
    }, 1400);
  }

  function toggleSave(id: string) {
    setSaved((previous) => {
      const next = previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [id, ...previous];
      saveSaved(next);
      return next;
    });
  }

  function resetFilters() {
    setQuery("");
    setLens("all");
    setEpoch("all");
    setSubRealm(null);
    setRegion("all");
    setCollection(null);
    setView("atlas");
  }

  function chooseLens(id: LensId) {
    setLens(id);
    setEpoch("all");
    setSubRealm(null);
    setRegion("all");
    setCollection(null);
    setView("atlas");
  }

  function chooseEpoch(id: EpochId) {
    setEpoch(id);
    setCollection(null);
    setView("atlas");
  }

  function updateQuery(value: string) {
    setQuery(value);
    setCollection(null);
    setView("atlas");
  }

  const resultContext = collection
    ? COLLECTIONS.find((item) => item.id === collection)?.name
    : view === "saved"
      ? "Kept on this device"
      : [activeLens?.label, activeEpoch?.label].filter(Boolean).join(" · ") || "Complete atlas";

  return (
    <div className="atlas-app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="wordmark" onClick={resetFilters} aria-label="Atlas of Looks, complete atlas">
            <span className="wordmark-mark" aria-hidden="true">A</span>
            <span>
              <b>Atlas of Looks</b>
              <small>Visual languages, decoded</small>
            </span>
          </button>

          <div className="global-search">
            <span className="search-glyph" aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search a culture, movement, film, game or mood"
              aria-label="Search the atlas"
              className="search-input"
            />
            <kbd>/</kbd>
          </div>

          <nav className="utility-nav" aria-label="Atlas views">
            <button className={view === "atlas" ? "active" : ""} onClick={() => setView("atlas")}>
              Atlas
            </button>
            <button className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}>
              <span aria-hidden="true">◆</span>
              Kept <span>{saved.length}</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="intro" aria-labelledby="atlas-title">
          <div className="intro-copy">
            <p className="eyebrow">A field guide across 40,000 years</p>
            <h1 id="atlas-title">From ochre walls <i>to latent worlds.</i></h1>
          </div>
          <div className="intro-note">
            <p>
              {STYLES.length} visual languages, each reduced to its essential grammar—line, light,
              pigment, space and surface.
            </p>
            <div className="intro-stats" aria-label="Atlas statistics">
              <span><strong>{STYLES.length}</strong> looks</span>
              <span><strong>{LENSES.length}</strong> clear lenses</span>
              <span><strong>1</strong> adaptable prompt each</span>
            </div>
          </div>
        </section>

        <section className="lens-section" aria-labelledby="lens-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ways of seeing</p>
              <h2 id="lens-title">Five distinct lenses, not a wall of departments.</h2>
            </div>
            <button className={lens === "all" ? "text-link active" : "text-link"} onClick={() => chooseLens("all")}>
              View all {STYLES.length}
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="lens-grid">
            {LENSES.map((item) => {
              const sample = STYLE_BY_ID.get(item.sampleId);
              return (
                <button
                  key={item.id}
                  className={`lens-card lens-${item.id}${lens === item.id ? " active" : ""}`}
                  onClick={() => chooseLens(item.id)}
                  aria-pressed={lens === item.id}
                >
                  {sample && <img src={sample.image.src} alt="" width="320" height="220" loading="eager" />}
                  <span className="lens-shade" />
                  <span className="lens-index">{item.index}</span>
                  <span className="lens-count">{lensCounts.get(item.id)} looks</span>
                  <span className="lens-copy">
                    <b>{item.label}</b>
                    <small>{item.short}</small>
                    <em>{item.description}</em>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="chronology" aria-labelledby="chronology-title">
          <div className="chronology-label">
            <p className="eyebrow">Chronology</p>
            <h2 id="chronology-title">Follow the image through time</h2>
          </div>
          <div className="epoch-track">
            {EPOCHS.map((item) => (
              <button
                key={item.id}
                className={epoch === item.id ? "active" : ""}
                onClick={() => chooseEpoch(epoch === item.id ? "all" : item.id)}
                aria-pressed={epoch === item.id}
              >
                <span className="epoch-dot" />
                <b>{item.label}</b>
                <small>{item.range}</small>
                <em>{epochCounts.get(item.id)} looks</em>
              </button>
            ))}
          </div>
        </section>

        <section className="workbench" aria-label="Prompt and curated trails">
          <div className="subject-control">
            <label htmlFor="atlas-subject">Your subject</label>
            <input
              id="atlas-subject"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                saveSubject(event.target.value);
              }}
              placeholder={DEFAULT_SUBJECT}
              className="subject-input"
            />
            <span>Applied to every prompt</span>
          </div>
          <div className="trails" aria-label="Curated trails">
            <span>Curated trails</span>
            {COLLECTIONS.map((item) => (
              <button
                key={item.id}
                className={collection === item.id ? "active" : ""}
                onClick={() => {
                  const next = collection === item.id ? null : item.id;
                  setCollection(next);
                  setLens("all");
                  setEpoch("all");
                  setSubRealm(null);
                  setRegion("all");
                  setView("atlas");
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>

        {(lens === "heritage" || SUB_REALMS[lens]) && view === "atlas" && !collection && (
          <section className="subfilters" aria-label="Refine the selected lens">
            <span>Refine</span>
            {lens === "heritage" ? (
              <>
                <button className={region === "all" ? "active" : ""} onClick={() => setRegion("all")}>All regions</button>
                {REGIONS.filter((item) => item.id !== "invented").map((item) => (
                  <button key={item.id} className={region === item.id ? "active" : ""} onClick={() => setRegion(item.id)}>
                    {item.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button className={!subRealm ? "active" : ""} onClick={() => setSubRealm(null)}>All</button>
                {SUB_REALMS[lens]?.map((realmId) => (
                  <button key={realmId} className={subRealm === realmId ? "active" : ""} onClick={() => setSubRealm(realmId)}>
                    {REALMS.find((item) => item.id === realmId)?.label}
                  </button>
                ))}
              </>
            )}
          </section>
        )}

        <section className="catalogue" aria-labelledby="results-title">
          <div className="catalogue-heading">
            <div>
              <p className="eyebrow">The plates</p>
              <h2 id="results-title">{resultContext}</h2>
              <span>{filtered.length} {filtered.length === 1 ? "look" : "looks"}</span>
            </div>
            <div className="catalogue-actions">
              {hasFilter && <button onClick={resetFilters}>Reset filters</button>}
              <button
                onClick={() => {
                  const style = filtered[Math.floor(Math.random() * filtered.length)];
                  if (style) setOpenId(style.id);
                }}
              >
                <span aria-hidden="true">↝</span>
                Surprise me
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span>Nothing found</span>
              <h3>The archive has no plate for that combination.</h3>
              <p>Try a broader word, another era, or return to the complete atlas.</p>
              <button onClick={resetFilters}>Clear the table</button>
            </div>
          ) : (
            <div className="plate-grid">
              {filtered.map((style, index) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  featured={index === 0 && filtered.length > 8}
                  saved={saved.includes(style.id)}
                  onOpen={() => setOpenId(style.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <b>Atlas of Looks</b>
          <span>A living index of how humanity has made images.</span>
        </div>
        <span>{STYLES.length} visual languages · Press / to search</span>
      </footer>

      {open && (
        <StyleDetail
          style={open}
          subject={subject}
          saved={saved.includes(open.id)}
          copied={copied}
          onClose={() => setOpenId(null)}
          onSave={() => toggleSave(open.id)}
          onOpen={setOpenId}
          pingCopy={pingCopy}
        />
      )}
    </div>
  );
}

function StyleCard({
  style,
  featured,
  saved,
  onOpen,
}: {
  style: Style;
  featured: boolean;
  saved: boolean;
  onOpen: () => void;
}) {
  const lens = LENSES.find((item) => item.id === lensFor(style));
  return (
    <button
      className={`style-card lens-${lensFor(style)}${featured ? " featured" : ""}`}
      onClick={onOpen}
      aria-label={`Open ${style.name}`}
    >
      <span className="style-image">
        <img
          src={style.image.src}
          alt=""
          width="720"
          height="480"
          loading={featured ? "eager" : "lazy"}
          decoding="async"
        />
        <span className="style-image-wash" />
        <span className="card-number">{CATALOG.get(style.id)}</span>
        {saved && <span className="saved-mark"><span aria-hidden="true">◆</span> Kept</span>}
        {featured && <span className="featured-label">Opening plate</span>}
      </span>
      <span className="style-card-copy">
        <span className="style-lens">{lens?.label}</span>
        <b>{style.name}</b>
        <span className="style-meta">
          <span>{style.origin}</span>
          <span>{style.era}</span>
        </span>
      </span>
    </button>
  );
}

function ImageCredit({ image }: { image: StyleImage }) {
  if (image.kind === "generated") return <p className="image-credit">Original Atlas specimen</p>;
  return (
    <p className="image-credit">
      Image: {" "}
      <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.title}</a>
      {image.creator ? ` · ${image.creator}` : ""}
      {image.licenseUrl ? (
        <>
          {" · "}<a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>
        </>
      ) : ` · ${image.license}`}
    </p>
  );
}

function StyleDetail({
  style,
  subject,
  saved,
  copied,
  onClose,
  onSave,
  onOpen,
  pingCopy,
}: {
  style: Style;
  subject: string;
  saved: boolean;
  copied: string | null;
  onClose: () => void;
  onSave: () => void;
  onOpen: (id: string) => void;
  pingCopy: (id: string) => void;
}) {
  const fullPrompt = fillSubject(style.prompt, subject);
  const detailLens = LENSES.find((item) => item.id === lensFor(style));

  return (
    <div className="overlay" onClick={onClose}>
      <aside
        className="atlas-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose}>Close</button>
        <div className="detail-hero">
        <img src={style.image.src} alt={style.image.alt} width="900" height="600" decoding="async" />
        <span className="detail-hero-wash" />
        <span className="detail-index">Plate {CATALOG.get(style.id)}</span>
      </div>

      <div className="detail-body">
        <div className="detail-header">
          <p className="detail-lens">{detailLens?.label} · {style.realms.join(" · ")}</p>
          <h2 id="style-title" className="detail-title">{style.name}</h2>
          <p className="detail-description">
            {style.origin} · {style.era}{style.aka.length ? ` · ${style.aka.join(", ")}` : ""}
          </p>
        </div>

        <ImageCredit image={style.image} />

        <div className="palette" aria-label={`${style.name} palette`}>
          {style.palette.map((color) => (
            <span key={color} style={{ background: color }} title={color}><i>{color}</i></span>
          ))}
        </div>

        <div className="detail-actions">
          <button onClick={() => copyText(fullPrompt).then(() => pingCopy("prompt"))}>
            <span aria-hidden="true">{copied === "prompt" ? "✓" : "□"}</span>
            {copied === "prompt" ? "Prompt copied" : "Copy full prompt"}
          </button>
          <button onClick={() => copyText(style.compact).then(() => pingCopy("compact"))}>
            <span aria-hidden="true">{copied === "compact" ? "✓" : "□"}</span>
            {copied === "compact" ? "Tags copied" : "Compact tags"}
          </button>
          <button className={saved ? "saved" : ""} onClick={onSave}>
            <span aria-hidden="true">◆</span>
            {saved ? "Kept" : "Keep this look"}
          </button>
        </div>

        <div className="detail-section detail-summary">
          <span>What it is</span>
          <p>{style.summary}</p>
        </div>

        <div className="detail-section">
          <span>Visual grammar</span>
          <p>{style.look}</p>
        </div>

        <div className="detail-section prompt-section">
          <div className="prompt-heading">
            <span>Adapted prompt</span>
            <small>Subject: {subject}</small>
          </div>
          <pre>{fullPrompt}</pre>
        </div>

        <div className="detail-columns">
          <div className="detail-section">
            <span>Best for</span>
            <p>{style.bestFor}</p>
          </div>
          <div className="detail-section">
            <span>Avoid</span>
            <p>{style.avoid}</p>
          </div>
        </div>

        {style.examples.length > 0 && (
          <div className="detail-section">
            <span>Touchstones</span>
            <p>{style.examples.join(" · ")}</p>
          </div>
        )}

        {style.related.length > 0 && (
          <div className="detail-section">
            <span>Nearby in the atlas</span>
            <div className="related-list">
              {style.related.map((id) => {
                const related = STYLE_BY_ID.get(id);
                if (!related) return null;
                return <button key={id} onClick={() => onOpen(id)}>{related.name}<span aria-hidden="true">↗</span></button>;
              })}
            </div>
          </div>
        )}
        </div>
      </aside>
    </div>
  );
}
