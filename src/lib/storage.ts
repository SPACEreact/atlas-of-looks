const KEY = "atlas-of-looks:v1"

type Store = {
  saved: string[]
  subject: string
}

const empty = (): Store => ({ saved: [], subject: "" })

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const p = JSON.parse(raw) as Partial<Store>
    return {
      saved: Array.isArray(p.saved) ? p.saved.filter((x) => typeof x === "string") : [],
      subject: typeof p.subject === "string" ? p.subject : "",
    }
  } catch {
    return empty()
  }
}

function write(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function loadSaved(): string[] {
  return read().saved
}

export function saveSaved(ids: string[]) {
  write({ ...read(), saved: ids })
}

export function loadSubject(): string {
  return read().subject
}

export function saveSubject(subject: string) {
  write({ ...read(), subject })
}
