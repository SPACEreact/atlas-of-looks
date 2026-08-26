import type { Style } from "../types"
import { compileAll, fillRelated } from "./compile"
import { CULTURES } from "./cultures"
import { HISTORY } from "./history"
import { MEDIUMS } from "./mediums"
import { CINEMA } from "./cinema"
import { ANIMATION } from "./animation"
import { GAMES } from "./games"
import { COMICS } from "./comics"
import { PHOTO } from "./photo"
import { DIGITAL } from "./digital"
import { DREAMS } from "./dreams"

const RAW = [
  ...CULTURES,
  ...HISTORY,
  ...MEDIUMS,
  ...CINEMA,
  ...ANIMATION,
  ...GAMES,
  ...COMICS,
  ...PHOTO,
  ...DIGITAL,
  ...DREAMS,
]

const seen = new Set<string>()
const unique = RAW.filter((r) => {
  if (seen.has(r.id)) return false
  seen.add(r.id)
  return true
})

export const STYLES: Style[] = fillRelated(compileAll(unique))

export const STYLE_BY_ID = new Map(STYLES.map((s) => [s.id, s]))

export const FEATURED_HEROES = STYLES.filter((s) => s.hero)

export const COLLECTIONS: { id: string; name: string; hint: string; ids: string[] }[] = [
  {
    id: "start",
    name: "Start here",
    hint: "A tour of the archive",
    ids: ["ukiyo-e", "ghibli", "film-noir", "bloodborne", "persian-miniature", "ndebele", "wet-glass-city", "pixel-art"],
  },
  {
    id: "night",
    name: "Night schools",
    hint: "When the lights go out",
    ids: ["film-noir", "shin-hanga", "blade-runner", "bloodborne", "silent-hill", "caravaggio", "wong-kar-wai", "dream-crt"],
  },
  {
    id: "sacred-gold",
    name: "Sacred & gold",
    hint: "Temples, leaf, hush",
    ids: ["thangka", "byzantine-mosaic", "tanjore", "rinpa", "icon", "tazhib", "kano", "honey-geometry"],
  },
  {
    id: "hand",
    name: "Touched by hand",
    hint: "Craft you can feel",
    ids: ["ghibli", "sumi-e", "stop-motion", "aardman", "kaguya", "watercolor", "riso", "ukiyo-e"],
  },
  {
    id: "harsh",
    name: "Harsh & heavy",
    hint: "Decay, dread, density",
    ids: ["bloodborne", "goya", "miura-berserk", "giger", "dark-souls", "fincher", "silent-hill", "expressionism"],
  },
  {
    id: "flat",
    name: "Flat & graphic",
    hint: "No depth, all design",
    ids: ["ukiyo-e", "ndebele", "superflat", "upa", "pop-art", "swiss-style", "wind-waker", "ligne-claire"],
  },
  {
    id: "close-eyes",
    name: "Close your eyes",
    hint: "Invented and impossible",
    ids: ["wet-glass-city", "hypnagogic-hallway", "liminal", "little-nemo", "surrealism", "ocean-ceiling", "fever-map", "quiet-apocalypse-pastel"],
  },
]
