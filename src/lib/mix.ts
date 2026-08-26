import type { Style } from "../types"

export const DEFAULT_SUBJECT = "a person standing in a doorway at dusk"

export function fillSubject(prompt: string, subject: string) {
  const s = subject.trim() || DEFAULT_SUBJECT
  return prompt.replaceAll("{subject}", s)
}

export function mixPrompt(styles: Style[], subject: string): string {
  const live = styles.filter(Boolean)
  if (!live.length) return ""
  if (live.length === 1) return fillSubject(live[0].prompt, subject)
  const sub = subject.trim() || DEFAULT_SUBJECT
  const parts = live.map((st, i) => {
    const role =
      i === 0 ? "as the dominant spatial and lighting grammar" : i === 1 ? "as pigment, line, and texture" : "as a late accent"
    return `${st.name} (${st.era}, ${st.origin}) ${role}: ${st.look}`
  })
  const palettes = live.flatMap((s) => s.palette).slice(0, 8)
  return `A ${sub}, created as a deliberate hybrid of ${live.map((s) => s.name).join(" × ")}. ${parts.join(" ")} Keep one coherent picture — not a collage of stickers. Let the first style own perspective and light; let the others stain the surface. Color world: ${palettes.join(", ")}. Do not genericize into stock fantasy illustration.`
}

export function mixCompact(styles: Style[]): string {
  return styles.map((s) => s.compact).join(" | ")
}
