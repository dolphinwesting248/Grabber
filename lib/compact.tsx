import type { TreeNode, Result } from "../types"
import { compactNode, compactText, getDisplayTree } from "./compact-logic"
import { TreeNodeRow } from "../components/TreeNodeRow"

export { compactNode, compactText, getDisplayTree } from "./compact-logic"

export function renderCompactRoot(
  treeData: TreeNode,
  compact: boolean
) {
  if (!compact) return <TreeNodeRow node={treeData} depth={0} />

  const compacted = compactNode(treeData)
  if (!compacted) return null
  if (Array.isArray(compacted)) {
    return compacted.map((node, i) => (
      <TreeNodeRow key={i} node={node} depth={0} />
    ))
  }
  return <TreeNodeRow node={compacted} depth={0} />
}

const tagColor = { color: "var(--accent)" }
const idColor = { color: "#7ec8a0" }
const classColor = { color: "var(--text-dim)" }
const shadowStyle = { color: "var(--text-dim)", fontStyle: "italic" as const }

function colorizeLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let rest = line

  // leading tree connectors
  const lead = rest.match(/^([\s├└│]*)/)
  if (lead && lead[1]) {
    parts.push(<span key="lead">{lead[1]}</span>)
    rest = rest.slice(lead[0].length)
  }

  // tag name (first word)
  const tagMatch = rest.match(/^([\w][\w-]*)/)
  if (tagMatch) {
    parts.push(<span key="tag" style={tagColor}>{tagMatch[1]}</span>)
    rest = rest.slice(tagMatch[0].length)
  }

  // remaining: #id .class "text" etc.
  const attrRe = /(#[^\s."]+)|(\.[^\s."]+)/g
  let m: RegExpExecArray | null
  let last = 0
  while ((m = attrRe.exec(rest)) !== null) {
    if (m.index > last) {
      parts.push(<span key={`t${last}`}>{rest.slice(last, m.index)}</span>)
    }
    if (m[1]) {
      // #id
      parts.push(<span key={`a${m.index}`} style={idColor}>{m[1]}</span>)
    } else if (m[2]) {
      // .class
      parts.push(<span key={`a${m.index}`} style={classColor}>{m[2]}</span>)
    }
    last = m.index + m[0].length
  }
  if (last < rest.length) {
    parts.push(<span key={`t${last}`}>{rest.slice(last)}</span>)
  }

  return parts
}

export function colorizeTreeText(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    // handle #shadow-root line
    if (line.includes("#shadow-root")) {
      const lead = line.match(/^([\s├└│]*)/)
      return (
        <div key={i}>
          {lead?.[1] || ""}
          <span style={shadowStyle}>#shadow-root</span>
        </div>
      )
    }
    return <div key={i}>{colorizeLine(line)}</div>
  })
}
