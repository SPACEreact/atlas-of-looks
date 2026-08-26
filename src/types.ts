export type Realm =
  | "cultures"
  | "history"
  | "mediums"
  | "cinema"
  | "animation"
  | "games"
  | "comics"
  | "photo"
  | "digital"
  | "dreams"

export type Style = {
  id: string
  name: string
  aka: string[]
  era: string
  origin: string
  region: string
  realms: Realm[]
  tags: string[]
  summary: string
  look: string
  palette: string[]
  prompt: string
  compact: string
  avoid: string
  bestFor: string
  examples: string[]
  related: string[]
  hero?: string
}

export type RawStyle = {
  id: string
  name: string
  aka?: string
  era: string
  origin: string
  region: string
  realms: string
  tags: string
  summary: string
  look: string
  palette: string
  avoid?: string
  bestFor?: string
  examples?: string
  related?: string
  hero?: string
  compact?: string
}

export const REALMS: { id: Realm | "all"; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "The whole archive" },
  { id: "cultures", label: "Cultures", hint: "Every civilization's eye" },
  { id: "history", label: "Art history", hint: "Movements and schools" },
  { id: "mediums", label: "Mediums", hint: "How the mark is made" },
  { id: "cinema", label: "Cinema", hint: "Lenses, grades, directors" },
  { id: "animation", label: "Studios", hint: "Animation houses" },
  { id: "games", label: "Games", hint: "Interactive worlds" },
  { id: "comics", label: "Print", hint: "Comics, posters, books" },
  { id: "photo", label: "Photo", hint: "Cameras and processes" },
  { id: "digital", label: "Digital", hint: "Screens and subcultures" },
  { id: "dreams", label: "Dreams", hint: "Invented and impossible" },
]

export const REGIONS: { id: string; label: string }[] = [
  { id: "east-asia", label: "East Asia" },
  { id: "south-asia", label: "South Asia" },
  { id: "se-asia", label: "Southeast Asia" },
  { id: "central-asia", label: "Central Asia" },
  { id: "middle-east", label: "Middle East" },
  { id: "africa", label: "Africa" },
  { id: "europe", label: "Europe" },
  { id: "americas", label: "Americas" },
  { id: "oceania", label: "Oceania" },
  { id: "global", label: "Global" },
  { id: "invented", label: "Invented" },
]
