import { useMemo, useState } from "react";
import { STYLES } from "./data";
import type { Style } from "./types";
import { LookDialog } from "./LookDialog";

const HISTORY = [
  ["40,000 BCE", "Mark", "Pigment, hand, animal, wall — image as trace, ritual and memory."],
  ["3000 BCE", "Order", "Registers, sacred scale and symbolic systems organise worlds."],
  ["500 BCE", "Body", "Observation, ideal proportion and competing ideas of representation."],
  ["500–1400", "Sacred space", "Gold, icon, manuscript, temple, mosque and cosmological geometry."],
  ["1400–1780", "Optical world", "Perspective, anatomy, oil, chiaroscuro and theatrical staging."],
  ["1780–1945", "Break the image", "Photography, industrial colour, abstraction, montage and modernism."],
  ["1945–2000", "Mass image", "Television, advertising, colour film, pop, subculture and games."],
  ["2000–now", "Networked image", "Screens, real-time worlds, computational aesthetics and generative systems."],
] as const;

const REALMS = [
  ["all", "Everything"],
  ["cultures", "Culture"],
  ["history", "Art history"],
  ["mediums", "Medium"],
  ["cinema", "Cinema"],
  ["animation", "Animation"],
  ["games", "Games"],
  ["comics", "Print"],
  ["photo", "Photo"],
  ["digital", "Digital"],
  ["dreams", "Imagined"],
] as const;

const realmLabel: Record<string, string> = {
  cultures: "Culture",
  history: "Art history",
  mediums: "Medium",
  cinema: "Cinema",
  animation: "Animation",
  games: "Games",
  comics: "Print",
  photo: "Photo",
  digital: "Digital",
  dreams: "Imagined",
};

function VisualCard({ style, onOpen }: { style: Style; onOpen: (style: Style) => void }) {
  return (
    <article className="visual-card">
      <button
        type="button"
        className="visual-card__image-wrap"
        onClick={() => onOpen(style)}
        aria-label={`Open ${style.name} prompt and history`}
      >
        <img className="visual-card__image" src={style.image.src} alt={style.image.alt || style.name} loading="lazy" />
        <span className="visual-card__realm">{realmLabel[style.realms[0]] || style.realms[0]}</span>
      </button>
      <div className="visual-card__body">
        <div className="visual-card__meta">{style.era} · {style.origin}</div>
        <h2>
          <button type="button" className="visual-card__title" onClick={() => onOpen(style)}>
            {style.name}
          </button>
        </h2>
        <p>{style.summary}</p>
        <div className="palette" aria-label={`${style.name} palette`}>
          {style.palette.slice(0, 5).map((colour) => (
            <span key={colour} style={{ background: colour }} title={colour} />
          ))}
        </div>
      </div>
    </article>
  );
}

function pickFeatured(styles: Style[]) {
  if (!styles.length) return [];
  const positions = [0, 0.13, 0.29, 0.47, 0.66, 0.83, 0.97];
  return positions.map((position) => styles[Math.min(styles.length - 1, Math.floor((styles.length - 1) * position))]);
}

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [query, setQuery] = useState("");
  const [realm, setRealm] = useState("all");

  const featuredStyles = useMemo(() => pickFeatured(STYLES), []);

  const filteredStyles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STYLES.filter((style) => {
      if (realm !== "all" && !style.realms.includes(realm as never)) return false;
      if (!q) return true;
      const text = `${style.name} ${style.aka.join(" ")} ${style.era} ${style.origin} ${style.region} ${style.summary} ${style.look} ${style.tags.join(" ")} ${style.examples.join(" ")}`.toLowerCase();
      return text.includes(q);
    });
  }, [query, realm]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Atlas of Looks home">
          <span className="brand__mark" aria-hidden="true" />
          <span>
            <b>ATLAS</b>
            <small>OF LOOKS</small>
          </span>
        </a>
        <div className="volume-mark">VOLUME II · VISUAL LINEAGE</div>
        <a className="knowledge-link" href="https://spacereact.github.io/knowledge/">
          Volume I · Knowledge <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main id="top">
        <section className="atlas-hero" aria-labelledby="atlas-title">
          <div className="atlas-hero__copy">
            <div className="overline">A LIVING INDEX OF VISUAL LANGUAGE</div>
            <h1 id="atlas-title">Atlas<br /><em>of Looks.</em></h1>
            <p>
              A field guide to the ways humans have made images feel like themselves — across culture,
              art history, cinema, animation, photography, games, print and digital worlds.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#library">Enter the atlas · {STYLES.length}</a>
              <a className="quiet-link" href="https://spacereact.github.io/knowledge/visual-literacy.html">Read Visual Literacy ↗</a>
            </div>
            <dl className="hero-stats" aria-label="Atlas statistics">
              <div><dt>{STYLES.length}</dt><dd>visual systems</dd></div>
              <div><dt>{REALMS.length - 1}</dt><dd>lineages</dd></div>
              <div><dt>01</dt><dd>connected knowledge volume</dd></div>
            </dl>
          </div>

          <div className="atlas-hero__mosaic" aria-label="A sample of visual systems in the atlas">
            {featuredStyles.slice(0, 6).map((style, index) => (
              <button
                key={style.id}
                type="button"
                className={`mosaic-tile mosaic-tile--${index + 1}`}
                onClick={() => setSelectedStyle(style)}
                aria-label={`Open ${style.name}`}
              >
                <img src={style.image.src} alt="" loading={index < 2 ? "eager" : "lazy"} />
                <span>{style.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="lineage-section" aria-labelledby="lineage-title">
          <header className="section-heading">
            <div>
              <span className="section-index">01</span>
              <span>VISUAL LINEAGE</span>
            </div>
            <div>
              <h2 id="lineage-title">The image keeps changing.<br />The human need does not.</h2>
              <p>Not a lesson. A quiet map of where visual language has travelled.</p>
            </div>
          </header>
          <div className="history-track">
            {HISTORY.map(([year, title, text], index) => (
              <article key={year}>
                <div className="history-track__rail"><i />{index < HISTORY.length - 1 && <span />}</div>
                <div className="history-track__year">{year}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="library-intro" aria-label="How to use the atlas">
          <div className="library-intro__number">02</div>
          <div>
            <div className="overline">THE REFERENCE VOLUME</div>
            <h2>Find a look.<br /><em>Open its grammar.</em></h2>
          </div>
          <p>
            Search by maker, movement, place, era or medium. Open any image to see its history,
            visual language, palette and a copy-ready prompt.
          </p>
        </section>

        <section className="atlas-library" id="library" aria-labelledby="library-title">
          <div className="library-toolbar">
            <div className="atlas-search">
              <label htmlFor="look-search" id="library-title">Search the atlas</label>
              <div className="atlas-search__field">
                <input
                  id="look-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="A look, era, maker, medium…"
                />
                <span>{filteredStyles.length} / {STYLES.length}</span>
              </div>
            </div>
            <div className="realm-tabs" aria-label="Filter visual systems by lineage">
              {REALMS.map(([id, label]) => (
                <button key={id} className={realm === id ? "active" : ""} onClick={() => setRealm(id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredStyles.length > 0 ? (
            <div className="atlas-grid">
              {filteredStyles.map((style) => (
                <VisualCard key={style.id} style={style} onOpen={setSelectedStyle} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>NO MATCH</span>
              <h2>The atlas has no entry for that yet.</h2>
              <button type="button" onClick={() => { setQuery(""); setRealm("all"); }}>Clear search</button>
            </div>
          )}
        </section>
      </main>

      <footer>
        <div><span className="brand__mark brand__mark--small" aria-hidden="true" /> ATLAS / OF / LOOKS</div>
        <p>Look widely. Borrow systems, not surfaces.</p>
        <a href="https://spacereact.github.io/knowledge/">Continue to Knowledge Atlas ↗</a>
      </footer>

      {selectedStyle && <LookDialog key={selectedStyle.id} style={selectedStyle} onClose={() => setSelectedStyle(null)} />}
    </div>
  );
}
