import { useEffect, useRef, useState } from "react";
import type { Style } from "./types";
import { historyFor, HISTORY_SOURCES } from "./data/look-history";

export function LookDialog({ style, onClose }: { style: Style; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(style.prompt);
      setCopyStatus("Prompt copied");
    } catch {
      setCopyStatus("Select the prompt text below and copy it manually.");
    }
  }
  const history = historyFor(style);
  return (
    <dialog ref={dialog} className="look-dialog" aria-labelledby="look-title" onCancel={onClose} onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
      <div className="look-dialog__header">
        <h2 id="look-title">{style.name}</h2>
        <button type="button" onClick={onClose} aria-label="Close look details" autoFocus>Close ×</button>
      </div>
      <div className="look-dialog__content">
        <img className="look-dialog__image" src={style.image.src} alt={style.image.alt || style.name} />
        <p className="look-dialog__meta">{style.era} · {style.origin}</p>
        <section aria-labelledby="prompt-title">
          <div className="look-dialog__section-heading"><h3 id="prompt-title">Image prompt</h3><button type="button" onClick={copyPrompt}>Copy prompt</button></div>
          <p>Replace <code>{"{subject}"}</code> with what you want to create.</p>
          <pre className="look-dialog__prompt" tabIndex={0}>{style.prompt}</pre>
          <p role="status" aria-live="polite">{copyStatus}</p>
        </section>
        <section aria-labelledby="history-title"><h3 id="history-title">{style.region === "invented" ? "Creative origins" : "Brief history"}</h3><p>{history}</p>{HISTORY_SOURCES[style.id] && <a href={HISTORY_SOURCES[style.id].url} target="_blank" rel="noreferrer">{HISTORY_SOURCES[style.id].label}</a>}</section>
        <section><h3>Visual language</h3><p>{style.look}</p></section>
        <section><h3>Best for</h3><p>{style.bestFor}</p></section>
        {style.examples.length > 0 && <section><h3>Reference points</h3><p>{style.examples.join(" · ")}</p></section>}
        <p className="look-dialog__credit">Image: {style.image.title}{style.image.creator && ` — ${style.image.creator}`}{" "}
          {/^https?:\/\//.test(style.image.sourceUrl) && <a href={style.image.sourceUrl} target="_blank" rel="noreferrer">Source</a>}{" "}
          {/^https?:\/\//.test(style.image.licenseUrl) ? <a href={style.image.licenseUrl} target="_blank" rel="noreferrer">{style.image.license}</a> : style.image.license}
        </p>
      </div>
    </dialog>
  );
}
