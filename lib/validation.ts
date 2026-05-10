export function isValidPart(p: string): boolean {
  return (
    p.startsWith(".") ||
    p.startsWith("#") ||
    p.startsWith("[") ||
    /^<[\w-]+>$/.test(p) ||
    (p.startsWith("(") && p.endsWith(")"))
  )
}

export function splitTopLevel(input: string): string[] {
  const parts: string[] = []
  let depth = 0, bdepth = 0, start = 0
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "(") depth++
    else if (input[i] === ")") depth--
    else if (input[i] === "[") bdepth++
    else if (input[i] === "]") bdepth--
    else if (depth === 0 && bdepth === 0) {
      const m = input.slice(i).match(/^(?:\|\||&&|\/\/|\/)/)
      if (m) {
        parts.push(input.slice(start, i).trim())
        start = i + m[0].length
        i += m[0].length - 1
      }
    }
  }
  parts.push(input.slice(start).trim())
  return parts
}

export function isBalanced(s: string): boolean {
  let depth = 0, bdepth = 0
  for (const ch of s) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "[") bdepth++
    if (ch === "]") bdepth--
    if (depth < 0 || bdepth < 0) return false
  }
  return depth === 0 && bdepth === 0
}

export function validateSelector(sel: string): string | null {
  if (!sel.trim()) return null

  const parts = splitTopLevel(sel)
  if (parts.some((p) => p === "")) {
    return "Each operator requires a selector on both sides"
  }
  const invalid = parts.find(
    (p) => !isValidPart(p) && !(p.startsWith("(") && p.endsWith(")"))
  )
  if (invalid) {
    return `"${invalid}" is not valid — use .class, #id, <tag>, .[regex], or #[regex]`
  }
  if (!isBalanced(sel)) {
    return "Unmatched parentheses"
  }
  for (const p of parts) {
    const reClass = p.match(/^\.\[(.+)\]$/)
    const reId = p.match(/^#\[(.+)\]$/)
    const reMatch = reClass || reId
    if (reMatch) {
      try { new RegExp(reMatch[1]) } catch {
        return `Invalid regex in "${p}"`
      }
    }
  }
  return null
}
