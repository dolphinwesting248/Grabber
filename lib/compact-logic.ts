import type { TreeNode, Result } from "../types"

// Keep in sync with attrLabel in lib/content-script.ts
function attrLabel(node: TreeNode): string {
  const parts: string[] = []
  if (node.elementId) parts.push("#" + node.elementId)
  if (node.className) parts.push("." + node.className.replace(/\s+/g, " ."))
  return parts.join(" ")
}

export function compactNodes(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    const compacted = compactNode(node)
    if (compacted) {
      if (Array.isArray(compacted)) {
        result.push(...compacted)
      } else {
        result.push(compacted)
      }
    }
  }
  return result
}

export function compactNode(
  node: TreeNode
): TreeNode | TreeNode[] | null {
  const children = compactNodes(node.children)
  const shadows = compactNodes(node.shadowChildren)

  if (node.ownText) {
    return { ...node, children, shadowChildren: shadows }
  }
  if (children.length > 0 || shadows.length > 0) {
    return [...children, ...shadows]
  }
  return null
}

export function compactText(
  node: TreeNode,
  prefix: string,
  isLast: boolean
): string {
  const attr = attrLabel(node)
  const parts = [node.tag]
  if (attr) parts.push(attr)
  if (node.ownText) parts.push(node.ownText)
  const label = parts.join(" ")
  const connector = isLast ? "└ " : "├ "
  let result = prefix + connector + label + "\n"

  const allChildren = [
    ...node.children.map((c) => ({ node: c, isShadow: false })),
    ...node.shadowChildren.map((c) => ({ node: c, isShadow: true }))
  ]

  allChildren.forEach(({ node: child, isShadow }, i) => {
    const childLast = i === allChildren.length - 1
    if (isShadow) {
      const childConnector = childLast ? "└ " : "├ "
      result +=
        prefix +
        (isLast ? "  " : "│ ") +
        childConnector +
        "#shadow-root\n"
      const childPrefix =
        prefix + (isLast ? "  " : "│ ") + (childLast ? "  " : "│ ")
      result += compactText(child, childPrefix, true)
    } else {
      const childPrefix = prefix + (isLast ? "  " : "│ ")
      result += compactText(child, childPrefix, childLast)
    }
  })

  return result
}

export function getDisplayTree(r: Result, compact: boolean): string {
  if (!compact) return r.tree
  const compacted = compactNode(r.treeData)
  if (!compacted) return ""
  if (Array.isArray(compacted)) {
    return compacted
      .map((n, i) => compactText(n, "", i === compacted.length - 1))
      .join("")
      .trimEnd()
  }
  return compactText(compacted, "", true).trimEnd()
}
