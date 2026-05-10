import type { HistoryEntry } from "../types"
import styles from "../styles"

export function HistoryDropdown({
  historyOpen,
  history,
  displayedHistory,
  hasMoreHistory,
  remainingCount,
  currentUrl,
  historyRef,
  onHistoryClick,
  onHistoryDelete,
  onShowMore,
}: {
  historyOpen: boolean
  history: HistoryEntry[]
  displayedHistory: HistoryEntry[]
  hasMoreHistory: boolean
  remainingCount: number
  currentUrl: string
  historyRef: React.RefObject<HTMLDivElement | null>
  onHistoryClick: (entry: HistoryEntry) => void
  onHistoryDelete: (e: React.MouseEvent, entry: HistoryEntry) => void
  onShowMore: () => void
}) {
  if (!historyOpen || history.length === 0) return null

  return (
    <div ref={historyRef} style={styles.historyDropdown}>
      {displayedHistory.map((entry, i) => {
        const isLast = i === displayedHistory.length - 1 && !hasMoreHistory
        const isCurrent = currentUrl && entry.url === currentUrl
        const base = isLast ? styles.historyItemLast : styles.historyItem
        const currentBorder = isCurrent ? styles.historyCurrent : undefined
        return (
          <button
            key={`${entry.timestamp}-${i}`}
            style={currentBorder ? { ...base, ...currentBorder } : base}
            onMouseDown={(e) => { e.preventDefault(); onHistoryClick(entry) }}>
            <div style={styles.historyContent}>
              <span style={styles.historySelector}>
                {isCurrent && <span style={styles.historyCurrentDot} />}
                {entry.selector}
              </span>
              <span style={styles.historyUrl}>{entry.url}</span>
            </div>
            <button
              style={styles.historyDelete}
              onClick={(e) => onHistoryDelete(e, entry)}
              title="Remove"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}>
              {"×"}
            </button>
          </button>
        )
      })}
      {hasMoreHistory && (
        <button
          style={styles.historyShowMore}
          onMouseDown={(e) => {
            e.preventDefault()
            onShowMore()
          }}>
          Show more ({remainingCount} remaining)
        </button>
      )}
    </div>
  )
}
