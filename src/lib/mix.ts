export const DEFAULT_SUBJECT = "a person standing in a doorway at dusk"

export function fillSubject(prompt: string, subject: string) {
  const s = subject.trim() || DEFAULT_SUBJECT
  return prompt.replaceAll("{subject}", s)
}
