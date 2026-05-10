import { memo } from "react"
import type { Result } from "../types"
import { getDisplayTree, colorizeTreeText } from "../lib/compact"
import styles from "../styles"

export const ResultCard = memo(function ResultCard({
  result,
  compact,
  selected,
  onToggle,
  onExpand
}: {
  result: Result
  compact: boolean
  selected: boolean
  onToggle: (i: number) => void
  onExpand: (r: Result) => void
}) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <label style={styles.checkWrap}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={selected}
              onChange={() => onToggle(result.index)}
            />
          </label>
          <span style={styles.badge}>{result.tagName}</span>
          <span style={styles.matchedBy}>{result.matchedBy}</span>
        </div>
        <div style={styles.cardActions}>
          <button
            style={styles.expandBtn}
            onClick={() => onExpand(result)}
            title="Expand">
            {"⛶"}
          </button>
          <span style={styles.idx}>#{result.index + 1}</span>
        </div>
      </div>
      <div style={styles.code}>
        {colorizeTreeText(getDisplayTree(result, compact))}
      </div>
    </div>
  )
})
