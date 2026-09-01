import { useMemo, useState } from "react";
import { STYLES } from "./data";
import type { Style } from "./types";

type Mode = "learn" | "train" | "atlas";
type DomainId =
  | "perception"
  | "colour"
  | "composition"
  | "blocking"
  | "light"
  | "camera"
  | "space"
  | "movement"
  | "editing"
  | "design"
  | "symbol"
  | "rhythm";

type Domain = {
  id: DomainId;
  index: string;
  title: string;
  kicker: string;
  question: string;
  description: string;
  variables: string[];
  paths: string[];
  accent: string;
};

type Drill = {
  id: string;
  domain: DomainId;
  title: string;
  prompt: string;
  left: string;
  right: string;
  answer: string;
  principle: string;
};

const DOMAINS: Domain[] = [
  {
    id: "perception",
    index: "01",
    title: "Perception",
    kicker: "Before art, there is attention",
    question: "What does the eye notice first — and why?",
    description:
      "Salience, figure-ground, hierarchy, pattern, memory and the mechanics that decide what survives a glance.",
    variables: ["attention", "contrast", "grouping", "hierarchy", "memory"],
    paths: ["Gestalt", "eye path", "visual weight", "ambiguity", "cognitive load"],
    accent: "#b7ff4a",
  },
  {
    id: "colour",
    index: "02",
    title: "Colour",
    kicker: "Pigment → perception → emotion",
    question: "What changes when hue stays the same but context changes?",
    description:
      "From prehistoric ochres to HDR: physics, pigment, harmony, culture, psychology, grading and emotional colour design.",
    variables: ["hue", "value", "chroma", "temperature", "proportion"],
    paths: ["cave pigment", "ritual", "Impressionism", "Technicolor", "digital grading"],
    accent: "#ff6b57",
  },
  {
    id: "composition",
    index: "03",
    title: "Composition",
    kicker: "Organising force inside the frame",
    question: "Where is the weight, and where does the eye travel?",
    description:
      "Balance, negative space, geometry, visual vectors, depth layers, tension and the orchestration of attention.",
    variables: ["balance", "scale", "density", "direction", "negative space"],
    paths: ["ritual order", "Renaissance space", "Japanese asymmetry", "modernism", "cinema"],
    accent: "#78a7ff",
  },
  {
    id: "blocking",
    index: "04",
    title: "Blocking",
    kicker: "Composition evolving through time",
    question: "Who has power before anyone says a word?",
    description:
      "Proximity, levels, orientation, entrances, isolation and movement as emotional relationship design.",
    variables: ["distance", "level", "orientation", "movement", "clusters"],
    paths: ["ritual", "theatre", "silent cinema", "Kurosawa", "modern staging"],
    accent: "#dd8cff",
  },
  {
    id: "light",
    index: "05",
    title: "Light",
    kicker: "Reveal, conceal, sculpt",
    question: "What should be seen, and what should remain uncertain?",
    description:
      "Direction, quality, falloff, ratio, motivation, colour and how illumination turns form into psychology.",
    variables: ["direction", "quality", "ratio", "falloff", "colour"],
    paths: ["sacred glow", "chiaroscuro", "photography", "studio cinema", "naturalism"],
    accent: "#ffd66b",
  },
  {
    id: "camera",
    index: "06",
    title: "Camera",
    kicker: "Point of view is meaning",
    question: "Where must the viewer stand to feel the scene correctly?",
    description:
      "Height, distance, lens, perspective, depth of field and movement taught as perception rather than specification trivia.",
    variables: ["height", "distance", "lens", "angle", "movement"],
    paths: ["camera obscura", "photography", "classical cinema", "wide-lens intimacy", "virtual camera"],
    accent: "#70e1d2",
  },
  {
    id: "space",
    index: "07",
    title: "Space & depth",
    kicker: "Flatness, layers, atmosphere",
    question: "How deep does this world feel — and should it?",
    description:
      "Perspective, scale, occlusion, compression, atmospheric depth and the expressive power of deliberate flatness.",
    variables: ["perspective", "occlusion", "scale", "focus", "compression"],
    paths: ["Egyptian registers", "reverse perspective", "Renaissance", "deep focus", "games"],
    accent: "#75c8ff",
  },
  {
    id: "movement",
    index: "08",
    title: "Movement",
    kicker: "Energy crossing space",
    question: "Where is motion going, and what resists it?",
    description:
      "Speed, anticipation, inertia, trajectory, stillness and the emotional relationship between moving subject and moving camera.",
    variables: ["speed", "trajectory", "inertia", "stillness", "camera relation"],
    paths: ["gesture", "chronophotography", "animation", "action cinema", "interactive motion"],
    accent: "#ff8eb4",
  },
  {
    id: "editing",
    index: "09",
    title: "Editing & time",
    kicker: "Meaning between images",
    question: "Why cut here — and why not one frame later?",
    description:
      "Duration, juxtaposition, continuity, montage, reaction, withholding and the emotional mathematics of time.",
    variables: ["duration", "order", "collision", "ellipsis", "reaction"],
    paths: ["tableaux", "continuity", "Soviet montage", "modern discontinuity", "networked rhythm"],
    accent: "#ffa76f",
  },
  {
    id: "design",
    index: "10",
    title: "Design & material",
    kicker: "The world reveals the character",
    question: "What does the environment know that dialogue does not?",
    description:
      "Production design, shape language, texture, costume, architecture, objects, class, wear and material storytelling.",
    variables: ["shape", "material", "texture", "wear", "scale"],
    paths: ["artifact", "architecture", "costume", "industrial design", "worldbuilding"],
    accent: "#c4a46a",
  },
  {
    id: "symbol",
    index: "11",
    title: "Symbol & culture",
    kicker: "Meaning travels through images",
    question: "What does this image mean here, to these people, at this time?",
    description:
      "Iconography, motif, metaphor, ritual, cultural convention and the danger of pretending every visual association is universal.",
    variables: ["motif", "ritual", "context", "repetition", "transformation"],
    paths: ["prehistory", "sacred image", "allegory", "advertising", "internet symbol"],
    accent: "#d9ff7f",
  },
  {
    id: "rhythm",
    index: "12",
    title: "Rhythm & contrast",
    kicker: "The engine underneath attention",
    question: "What repeats, what breaks, and what arrives late?",
    description:
      "Pattern, interruption and contrast across shape, colour, light, movement, composition and time.",
    variables: ["repeat", "interval", "contrast", "accent", "interruption"],
    paths: ["ornament", "music-image analogy", "graphic design", "montage", "motion systems"],
    accent: "#a29bff",
  },
];

const DRILLS: Drill[] = [
  {
    id: "weight",
    domain: "composition",
    title: "Feel the weight",
    prompt: "Which frame feels more unstable? Decide before reading the explanation.",
    left: "A large dark mass sits close to the centre. The opposite side is quiet.",
    right: "The same mass is pushed hard against the edge with empty space pulling against it.",
    answer: "B",
    principle: "Edge tension + asymmetric negative space create unresolved directional pull.",
  },
  {
    id: "power",
    domain: "blocking",
    title: "Read the relationship",
    prompt: "Who feels more powerful before dialogue begins?",
    left: "Character A stands foreground, still, while B crosses behind them.",
    right: "A and B stand equal distance from camera on the same line.",
    answer: "A",
    principle: "Foreground scale and stillness can produce authority while motion becomes subordinate information.",
  },
  {
    id: "colour-context",
    domain: "colour",
    title: "Context changes colour",
    prompt: "The central colour is identical. Which version feels hotter?",
    left: "The patch is surrounded by blue-green neighbours.",
    right: "The patch is surrounded by orange-red neighbours.",
    answer: "A",
    principle: "Simultaneous contrast shifts perception relationally; colour never arrives alone.",
  },
  {
    id: "lens",
    domain: "camera",
    title: "Distance before lens",
    prompt: "Which setup makes the face feel more spatially intimate?",
    left: "Camera moves physically close with a wider field of view.",
    right: "Camera stays far away and magnifies with a long lens.",
    answer: "A",
    principle: "Camera-to-subject distance changes perspective relationships; focal length alone is not the whole effect.",
  },
  {
    id: "cut",
    domain: "editing",
    title: "Withhold the reaction",
    prompt: "Which edit is likely to increase tension after terrible news?",
    left: "Cut immediately to the listener's face.",
    right: "Hold on the speaker for two beats before revealing the listener.",
    answer: "B",
    principle: "Delayed information can make the unseen reaction psychologically louder.",
  },
  {
    id: "light",
    domain: "light",
    title: "Reveal vs conceal",
    prompt: "Which lighting choice makes a familiar face feel less emotionally readable?",
    left: "Broad frontal light fills both eyes and softens modelling.",
    right: "Hard side light loses one eye and increases facial separation.",
    answer: "B",
    principle: "Unequal access to facial information can create ambiguity, secrecy or threat.",
  },
];

const HISTORY = [
  ["40,000 BCE", "Mark", "Pigment, hand, animal, wall — image as trace, ritual and memory."],
  ["3000 BCE", "Order", "Registers, sacred scale and durable symbolic systems organise worlds."],
  ["500 BCE", "Body", "Ideal proportion, observation and competing ideas of representation."],
  ["500–1400", "Sacred space", "Gold, icon, manuscript, temple, mosque and cosmological geometry."],
  ["1400–1780", "Optical world", "Perspective, anatomy, oil, chiaroscuro and theatrical staging."],
  ["1780–1945", "Break the image", "Photography, industrial colour, abstraction, montage and modernism."],
  ["1945–2000", "Mass image", "Television, advertising, colour film, pop, subculture and games."],
  ["2000–now", "Networked image", "Screens, real-time worlds, computational aesthetics and generative systems."],
];

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

function sampleForDomain(domain: DomainId): Style[] {
  const terms: Record<DomainId, string[]> = {
    perception: ["optical", "minimal", "op art", "bauhaus"],
    colour: ["fauvism", "technicolor", "impression", "neon", "colour"],
    composition: ["renaissance", "ukiyo", "kubrick", "constructiv"],
    blocking: ["kurosawa", "bergman", "spielberg", "bong"],
    light: ["caravaggio", "baroque", "noir", "rembrandt"],
    camera: ["cinema", "photography", "new wave", "malick"],
    space: ["egypt", "perspective", "renaissance", "isometric"],
    movement: ["futurism", "animation", "action", "akira"],
    editing: ["montage", "soviet", "new wave", "cinema"],
    design: ["bauhaus", "art deco", "brutal", "production"],
    symbol: ["egypt", "byzantine", "tanjore", "symbolism"],
    rhythm: ["op art", "constructiv", "pattern", "graphic"],
  };
  const wanted = terms[domain];
  const scored = STYLES.map((style) => {
    const haystack = `${style.name} ${style.summary} ${style.look} ${style.tags.join(" ")} ${style.examples.join(" ")}`.toLowerCase();
    const score = wanted.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
    return { style, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.style);
  return scored.length ? scored : STYLES.slice(0, 6);
}

function VisualCard({ style, compact = false }: { style: Style; compact?: boolean }) {
  return (
    <article className={`visual-card ${compact ? "visual-card--compact" : ""}`}>
      <div className="visual-card__image-wrap">
        <img className="visual-card__image" src={style.image.src} alt={style.image.alt || style.name} loading="lazy" />
        <span className="visual-card__realm">{realmLabel[style.realms[0]] || style.realms[0]}</span>
      </div>
      <div className="visual-card__body">
        <div className="visual-card__meta">{style.era} · {style.origin}</div>
        <h3>{style.name}</h3>
        {!compact && <p>{style.summary}</p>}
        <div className="palette" aria-label={`${style.name} palette`}>
          {style.palette.slice(0, 5).map((colour) => (
            <span key={colour} style={{ background: colour }} title={colour} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("learn");
  const [activeDomain, setActiveDomain] = useState<DomainId>("colour");
  const [query, setQuery] = useState("");
  const [realm, setRealm] = useState("all");
  const [drillIndex, setDrillIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);

  const domain = DOMAINS.find((item) => item.id === activeDomain) || DOMAINS[1];
  const domainStyles = useMemo(() => sampleForDomain(activeDomain), [activeDomain]);
  const drill = DRILLS[drillIndex % DRILLS.length];

  const filteredStyles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STYLES.filter((style) => {
      if (realm !== "all" && !style.realms.includes(realm as never)) return false;
      if (!q) return true;
      const text = `${style.name} ${style.aka.join(" ")} ${style.era} ${style.origin} ${style.summary} ${style.look} ${style.tags.join(" ")}`.toLowerCase();
      return text.includes(q);
    });
  }, [query, realm]);

  function nextDrill() {
    setDrillIndex((value) => (value + 1) % DRILLS.length);
    setChoice(null);
    setReveal(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setMode("learn")} aria-label="Atlas of Looks home">
          <span className="brand__mark" />
          <span>ATLAS / OF / LOOKS</span>
        </button>
        <nav className="mode-switch" aria-label="Primary navigation">
          {(["learn", "train", "atlas"] as Mode[]).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
              {item}
            </button>
          ))}
        </nav>
        <div className="topbar__note">visual literacy laboratory</div>
      </header>

      {mode === "learn" && (
        <main>
          <section className="hero">
            <div className="hero__eyebrow">SEE → NOTICE → PREDICT → CHANGE → CREATE</div>
            <h1>Train the eye,<br /><em>not the notebook.</em></h1>
            <p className="hero__lede">
              A visual system for learning art from cave walls to generative worlds — history, perception,
              cinematography and design organised around what you can actually <strong>see and control</strong>.
            </p>
            <div className="hero__actions">
              <button className="primary" onClick={() => setMode("train")}>Start a visual drill</button>
              <button className="secondary" onClick={() => setMode("atlas")}>Open the full atlas · {STYLES.length}</button>
            </div>
            <div className="hero__meter">
              <span>Knowledge</span><div><i style={{ width: "20%" }} /></div><span>Intuition</span>
            </div>
          </section>

          <section className="domain-section">
            <div className="section-heading">
              <div><span className="section-index">01</span><span>THE VISUAL SYSTEM</span></div>
              <p>Choose a variable. Learn it across perception, history, media and emotion.</p>
            </div>
            <div className="domain-layout">
              <aside className="domain-list">
                {DOMAINS.map((item) => (
                  <button
                    key={item.id}
                    className={activeDomain === item.id ? "active" : ""}
                    onClick={() => setActiveDomain(item.id)}
                    style={{ "--domain-accent": item.accent } as React.CSSProperties}
                  >
                    <span>{item.index}</span><strong>{item.title}</strong><i>↗</i>
                  </button>
                ))}
              </aside>

              <div className="domain-detail" style={{ "--domain-accent": domain.accent } as React.CSSProperties}>
                <div className="domain-detail__header">
                  <div className="domain-detail__number">{domain.index}</div>
                  <div>
                    <div className="overline">{domain.kicker}</div>
                    <h2>{domain.title}</h2>
                    <p className="domain-question">“{domain.question}”</p>
                  </div>
                </div>
                <p className="domain-description">{domain.description}</p>
                <div className="variable-row">
                  {domain.variables.map((variable) => <span key={variable}>{variable}</span>)}
                </div>
                <div className="path-map">
                  <div className="path-map__label">TRACE THROUGH TIME</div>
                  <div className="path-map__line">
                    {domain.paths.map((path, index) => (
                      <div key={path}><i /><span>{path}</span>{index < domain.paths.length - 1 && <b>→</b>}</div>
                    ))}
                  </div>
                </div>
                <div className="domain-gallery">
                  {domainStyles.slice(0, 3).map((style) => <VisualCard key={style.id} style={style} compact />)}
                </div>
                <button className="domain-train" onClick={() => setMode("train")}>Train {domain.title.toLowerCase()} perception →</button>
              </div>
            </div>
          </section>

          <section className="history-section">
            <div className="section-heading">
              <div><span className="section-index">02</span><span>THE TIME AXIS</span></div>
              <p>History is not another category. It runs through every visual decision.</p>
            </div>
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

          <section className="method-section">
            <div className="method-copy">
              <div className="section-index">03 · HOW MASTERY MOVES</div>
              <h2>Terminology enters late.<br />Judgment enters first.</h2>
              <p>
                Begin with a blind visual decision. Reveal the variable. Manipulate it. Find its historical echoes.
                Then solve a new image without being told which rule to use.
              </p>
            </div>
            <div className="method-steps">
              {["FEEL IT", "SEE IT", "NAME IT", "CONTROL IT", "COMBINE IT", "BREAK IT", "INVENT WITH IT"].map((step, index) => (
                <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></div>
              ))}
            </div>
          </section>
        </main>
      )}

      {mode === "train" && (
        <main className="train-page">
          <section className="train-header">
            <div className="train-header__meta">PERCEPTUAL DRILL · {String(drillIndex + 1).padStart(2, "0")}/{String(DRILLS.length).padStart(2, "0")}</div>
            <h1>{drill.title}</h1>
            <p>{drill.prompt}</p>
          </section>
          <section className="drill-stage">
            <button className={`drill-option ${choice === "A" ? "selected" : ""}`} onClick={() => { setChoice("A"); setReveal(false); }}>
              <span className="drill-option__letter">A</span>
              <div className={`abstract-frame abstract-frame--${drill.domain} abstract-frame--a`} aria-hidden="true"><i /><b /><em /></div>
              <p>{drill.left}</p>
            </button>
            <div className="drill-vs">VS</div>
            <button className={`drill-option ${choice === "B" ? "selected" : ""}`} onClick={() => { setChoice("B"); setReveal(false); }}>
              <span className="drill-option__letter">B</span>
              <div className={`abstract-frame abstract-frame--${drill.domain} abstract-frame--b`} aria-hidden="true"><i /><b /><em /></div>
              <p>{drill.right}</p>
            </button>
          </section>
          <div className="drill-controls">
            {!reveal ? (
              <button className="primary" disabled={!choice} onClick={() => setReveal(true)}>Commit perception</button>
            ) : (
              <button className="primary" onClick={nextDrill}>Next drill →</button>
            )}
            <span>Choose before explanation. No points. Train judgment.</span>
          </div>
          {reveal && (
            <section className={`reveal-panel ${choice === drill.answer ? "correct" : "productive"}`}>
              <div className="reveal-panel__result">{choice === drill.answer ? "YOUR EYE CAUGHT IT" : "USEFUL MISS"}</div>
              <h2>{drill.principle}</h2>
              <p>Now name the mechanism only after experiencing the difference. The next step is recognizing it in real work.</p>
              <div className="reveal-examples">
                {sampleForDomain(drill.domain).slice(0, 4).map((style) => <VisualCard key={style.id} style={style} compact />)}
              </div>
            </section>
          )}
          <section className="train-domains">
            <span>DRILL OTHER SYSTEMS</span>
            <div>{DOMAINS.map((item) => <button key={item.id} onClick={() => { const index = DRILLS.findIndex((d) => d.domain === item.id); if (index >= 0) { setDrillIndex(index); setChoice(null); setReveal(false); } }}>{item.title}</button>)}</div>
          </section>
        </main>
      )}

      {mode === "atlas" && (
        <main className="atlas-page">
          <section className="atlas-header">
            <div>
              <div className="overline">REFERENCE LIBRARY · {STYLES.length} VISUAL SYSTEMS</div>
              <h1>The atlas stays enormous.</h1>
              <p>Search cultures, movements, mediums, cinema, animation, games, photography, digital aesthetics and imagined worlds.</p>
            </div>
            <div className="atlas-search">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a look, era, maker, medium…" />
              <span>{filteredStyles.length} results</span>
            </div>
          </section>
          <div className="realm-tabs">
            {["all", "cultures", "history", "mediums", "cinema", "animation", "games", "comics", "photo", "digital", "dreams"].map((item) => (
              <button key={item} className={realm === item ? "active" : ""} onClick={() => setRealm(item)}>{item === "all" ? "Everything" : realmLabel[item]}</button>
            ))}
          </div>
          <section className="atlas-grid">
            {filteredStyles.map((style) => <VisualCard key={style.id} style={style} />)}
          </section>
        </main>
      )}

      <footer>
        <div>ATLAS OF LOOKS</div>
        <p>Build visual memory until principles become instinct.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ TOP</button>
      </footer>
    </div>
  );
}
