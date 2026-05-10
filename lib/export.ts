import type { Result } from "../types"

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportResults(
  items: Result[],
  fmt: "json" | "txt",
  content: "text" | "tree"
) {
  const now = new Date().toISOString().slice(0, 19).replace(/:/g, "-")

  if (fmt === "json") {
    const out =
      content === "text"
        ? items.map((r) => ({
            tagName: r.tagName,
            text: r.textContent,
            matchedBy: r.matchedBy
          }))
        : items.map((r) => ({
            tagName: r.tagName,
            treeData: r.treeData,
            matchedBy: r.matchedBy
          }))
    downloadBlob(
      JSON.stringify(out, null, 2),
      `grabber-${now}.json`,
      "application/json"
    )
  } else {
    const out =
      content === "text"
        ? items.map((r) => r.textContent).join("\n\n")
        : items
            .map((r) => `${r.tagName} (${r.matchedBy})\n${r.tree}`)
            .join("\n\n---\n\n")
    downloadBlob(out, `grabber-${now}.txt`, "text/plain")
  }
}
