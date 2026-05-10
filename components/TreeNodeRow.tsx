import { useState, useMemo } from "react"
import type { TreeNode } from "../types"
import { useTheme } from "../lib/ThemeContext"
import type { Theme } from "../lib/ThemeContext"

const FONT =
  "'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'Menlo', monospace"

const palette: Record<Theme, { text: string; dim: string; accent: string; idClr: string }> = {
  dark: { text: "#d4d4d4", dim: "#a0a0a0", accent: "#d4a853", idClr: "#7ec8a0" },
  light: { text: "#2c2c2c", dim: "#8a8a8a", accent: "#9b6806", idClr: "#2e8b57" }
}

function useTreeStyles() {
  const theme = useTheme()
  const c = palette[theme]
  return useMemo(
    () => ({
      toggleBtn: {
        width: 20,
        height: 20,
        padding: 0,
        fontSize: 13,
        lineHeight: "20px",
        textAlign: "center" as const,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: c.dim,
        flexShrink: 0,
        fontFamily: FONT
      },
      toggleSpacer: {
        width: 20,
        flexShrink: 0
      },
      treeLabel: {
        color: c.text,
        fontSize: 13,
        fontFamily: FONT
      },
      tagName: {
        color: c.accent,
        fontFamily: FONT
      },
      ownText: {
        color: c.text,
        fontFamily: FONT
      },
      attrText: {
        fontSize: 11,
        fontFamily: FONT
      },
      attrId: {
        color: c.idClr
      },
      attrClass: {
        color: c.dim
      },
      attrHint: {
        color: c.dim,
        fontSize: 10
      },
      shadowLabel: {
        color: c.dim,
        fontStyle: "italic" as const,
        fontSize: 12,
        fontFamily: FONT
      }
    }),
    [c]
  )
}

function treeRow(depth: number): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "baseline",
    paddingLeft: depth * 16,
    lineHeight: "22px",
    whiteSpace: "pre",
    fontFamily: FONT
  }
}

function ShadowChildren({
  children,
  depth
}: {
  children: TreeNode[]
  depth: number
}) {
  const [collapsed, setCollapsed] = useState(false)
  const s = useTreeStyles()

  return (
    <div>
      <div style={treeRow(depth)}>
        <button
          style={s.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "▸" : "▾"}
        </button>
        <span style={s.shadowLabel}>#shadow-root</span>
      </div>
      {!collapsed && (
        <div>
          {children.map((child, i) => (
            <TreeNodeRow key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeNodeRow({
  node,
  depth
}: {
  node: TreeNode
  depth: number
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAttrs, setShowAttrs] = useState(false)
  const hasKids = node.children.length > 0 || node.shadowChildren.length > 0
  const hasAttrs = !!(node.className || node.elementId)
  const s = useTreeStyles()

  return (
    <div>
      <div style={treeRow(depth)}>
        {hasKids ? (
          <button
            style={s.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "▸" : "▾"}
          </button>
        ) : (
          <span style={s.toggleSpacer} />
        )}
        <span style={s.treeLabel}>
          <span
            style={{ ...s.tagName, cursor: hasAttrs ? "pointer" : undefined }}
            onClick={hasAttrs ? () => setShowAttrs(!showAttrs) : undefined}>
            {node.tag}
          </span>
          {hasAttrs && showAttrs && (
            <span style={s.attrText}>
              {" "}
              {node.elementId && <span style={s.attrId}>#{node.elementId}</span>}
              {node.className && (
                <span>
                  {node.className.split(/\s+/).map((c, i) => (
                    <span key={i}>{i > 0 || node.elementId ? " " : ""}<span style={s.attrClass}>.{c}</span></span>
                  ))}
                </span>
              )}
            </span>
          )}
          {hasAttrs && !showAttrs && (
            <span style={s.attrHint}> +</span>
          )}
          {node.ownText && (
            <span style={s.ownText}> {node.ownText}</span>
          )}
        </span>
      </div>
      {hasKids && !collapsed && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeRow key={`c${i}`} node={child} depth={depth + 1} />
          ))}
          {node.shadowChildren.length > 0 && (
            <ShadowChildren
              children={node.shadowChildren}
              depth={depth + 1}
            />
          )}
        </div>
      )}
    </div>
  )
}
