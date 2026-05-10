import { useState, useEffect, useRef, useCallback } from "react"
import type { Result } from "./types"
import { renderCompactRoot, getDisplayTree } from "./lib/compact"
import { grabPageDOM } from "./lib/content-script"
import { validateSelector } from "./lib/validation"
import { CARD_HEIGHT, OVERSCAN, INITIAL_BATCH, themeCSS } from "./lib/theme"
import { ThemeContext } from "./lib/ThemeContext"
import { SettingsPanel } from "./components/SettingsPanel"
import { ResultCard } from "./components/ResultCard"
import { Header } from "./components/Header"
import { HistoryDropdown } from "./components/HistoryDropdown"
import { useHistory } from "./hooks/useHistory"
import { exportResults } from "./lib/export"
import styles from "./styles"

const examples = [
  { sel: "<div>", label: "All divs" },
  { sel: ".container", label: "By class" },
  { sel: "#app", label: "By id" },
  { sel: "[href^='https']", label: "By attribute" },
  { sel: "div / p", label: "Direct children" }
]

function IndexPopup() {
  const [selector, setSelector] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [expanded, setExpanded] = useState<Result | null>(null)
  const [ready, setReady] = useState(false)
  const [restored, setRestored] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [compact, setCompact] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [threshold, setThreshold] = useState(50)
  const [showSettings, setShowSettings] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [exportFmt, setExportFmt] = useState<"json" | "txt">("json")
  const [exportContent, setExportContent] = useState<"text" | "tree">("tree")
  const [visStart, setVisStart] = useState(0)
  const [visEnd, setVisEnd] = useState(INITIAL_BATCH)
  const resultsRef = useRef<HTMLDivElement>(null)
  const scrollPosRef = useRef(0)
  const lenRef = useRef(0)
  const cancelledRef = useRef(false)

  const hist = useHistory((entry) => setSelector(entry.selector))

  // ---- restore state ----
  useEffect(() => {
    chrome.storage.local
      .get(["lastSearch", "compact", "theme", "threshold", "exportFmt", "exportContent"])
      .then((data: Record<string, unknown>) => {
        const lastSearch = data.lastSearch as
          | { selector: string; results: Result[]; count: number }
          | undefined
        if (lastSearch) {
          setSelector(lastSearch.selector || "")
          setResults(lastSearch.results || [])
          setCount(lastSearch.count || 0)
          setHasSearched(true)
        }
        const savedCompact = data.compact as boolean | undefined
        const savedTheme = data.theme as "dark" | "light" | undefined
        const savedThreshold = data.threshold as number | undefined
        const savedFmt = data.exportFmt as "json" | "txt" | undefined
        const savedContent = data.exportContent as "text" | "tree" | undefined
        if (savedCompact !== undefined) setCompact(savedCompact)
        if (savedTheme) setTheme(savedTheme)
        if (savedThreshold !== undefined) setThreshold(savedThreshold)
        if (savedFmt) setExportFmt(savedFmt)
        if (savedContent) setExportContent(savedContent)
        setRestored(true)
        setReady(true)
      })
  }, [])

  // ---- scroll restore ----
  useEffect(() => {
    if (!expanded && !showSettings && scrollPosRef.current > 0) {
      requestAnimationFrame(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollTop = scrollPosRef.current
          recalcVisible()
        }
      })
    }
  }, [expanded, showSettings])

  // ---- persistence ----
  useEffect(() => {
    if (ready) chrome.storage.local.set({ compact, theme, threshold, exportFmt, exportContent })
  }, [ready, compact, theme, threshold, exportFmt, exportContent])

  // ---- error auto-dismiss ----
  useEffect(() => {
    if (!error) return
    const id = setTimeout(() => setError(""), 3000)
    return () => clearTimeout(id)
  }, [error])

  // ---- virtual scroll ----
  const recalcVisible = useCallback(() => {
    const el = resultsRef.current
    if (!el) return
    const start = Math.max(0, Math.floor(el.scrollTop / CARD_HEIGHT) - OVERSCAN)
    const end = Math.min(
      lenRef.current,
      Math.ceil((el.scrollTop + el.clientHeight) / CARD_HEIGHT) + OVERSCAN
    )
    setVisStart(start)
    setVisEnd(end)
  }, [])

  useEffect(() => {
    lenRef.current = displayResults.length
    if (displayResults.length > 0) {
      setVisStart(0)
      setVisEnd(INITIAL_BATCH)
    }
  }, [results, compact])

  // ---- selection ----
  const toggleSelect = useCallback((i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) { next.delete(i) } else { next.add(i) }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === results.length
        ? new Set()
        : new Set(results.map((r) => r.index))
    )
  }, [results])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // ---- export ----
  const handleExport = useCallback(() => {
    const items = results.filter((r) => selected.has(r.index))
    if (items.length === 0) {
      setError("Select at least one element to export")
      return
    }
    exportResults(items, exportFmt, exportContent)
  }, [results, selected, exportFmt, exportContent])

  // ---- grab ----
  const handleGrab = async () => {
    const sel = selector.trim()
    if (!sel) { setError("Enter a selector"); return }
    const validationError = validateSelector(sel)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError("")
    setResults([])
    setCount(0)
    setSelected(new Set())
    setRestored(false)
    cancelledRef.current = false

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) { setError("Cannot access current tab"); return }

      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: grabPageDOM,
        args: [sel]
      })

      if (cancelledRef.current) return

      const result = injection?.result as
        | { success: true; results: Result[]; count: number }
        | { success: false; error: string }
        | undefined

      if (result?.success) {
        setResults(result.results)
        setCount(result.count)
        setHasSearched(true)
        if (result.count <= threshold) {
          chrome.storage.local.set({
            lastSearch: { selector: sel, results: result.results, count: result.count }
          })
        }
        hist.addHistoryEntry(sel, tab.url || "")
      } else if (result) {
        setError(result.error)
      } else {
        setError("No result from page")
      }
    } catch (err) {
      if (cancelledRef.current) return
      setError(err instanceof Error ? err.message : "Failed to communicate with page")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = useCallback(() => {
    cancelledRef.current = true
    setLoading(false)
  }, [])

  const handleClear = () => {
    setSelector("")
    setResults([])
    setCount(0)
    setError("")
    setExpanded(null)
    setSelected(new Set())
    setHasSearched(false)
    chrome.storage.local.remove("lastSearch")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (loading) { handleCancel() } else { handleGrab() }
    }
  }

  // ---- render helpers ----
  const displayResults = compact
    ? results.filter((r) => getDisplayTree(r, true) !== "")
    : results
  const visibleResults = displayResults.slice(visStart, visEnd)
  const totalHeight = displayResults.length * CARD_HEIGHT
  const offsetY = visStart * CARD_HEIGHT
  const selCount = selected.size

  if (!ready) return null

  return (
    <ThemeContext.Provider value={theme}>
    <div style={styles.container} data-theme={theme}>
      <style>{themeCSS}</style>

      <Header
        theme={theme}
        setTheme={setTheme}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        compact={compact}
        setCompact={setCompact}
        onSaveScroll={() => {
          scrollPosRef.current = resultsRef.current?.scrollTop ?? 0
        }} />

      {/* Input */}
      <div style={{ ...styles.historyWrap }}>
        <div style={styles.inputRow}>
          <div style={styles.inputWrap}>
            <span style={styles.inputPrompt}>{">"}</span>
            <input
              style={styles.input}
              placeholder="Enter a selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              onFocus={hist.handleInputFocus}
              onBlur={hist.handleInputBlur}
              onKeyDown={handleKeyDown} />
          </div>
          <button
            style={loading ? { ...styles.btn, background: "var(--red)" } : styles.btn}
            onClick={loading ? handleCancel : handleGrab}>
            {loading ? "Cancel" : "Grab"}
          </button>
          <button style={styles.clearBtn} onClick={handleClear} title="Clear">
            {"×"}
          </button>
        </div>

        <HistoryDropdown
          historyOpen={hist.historyOpen}
          history={hist.history}
          displayedHistory={hist.displayedHistory}
          hasMoreHistory={hist.hasMoreHistory}
          remainingCount={hist.remainingCount}
          currentUrl={hist.currentUrl}
          historyRef={hist.historyRef}
          onHistoryClick={hist.handleHistoryClick}
          onHistoryDelete={hist.handleHistoryDelete}
          onShowMore={() => hist.handleShowMore(hist.history.length)} />
      </div>

      {/* Content area */}
      {showSettings ? (
        <SettingsPanel
          threshold={threshold} setThreshold={setThreshold}
          exportFmt={exportFmt} setExportFmt={setExportFmt}
          exportContent={exportContent} setExportContent={setExportContent}
          historyCount={hist.historyCount} setHistoryCount={hist.setHistoryCount} />
      ) : expanded ? (
        <div style={styles.detail}>
          <div style={styles.detailHeader}>
            <button style={styles.backBtn} onClick={() => setExpanded(null)}>
              {"←"}
            </button>
            <span style={styles.badge}>{expanded.tagName}</span>
            <span style={styles.idx}>#{expanded.index + 1}</span>
          </div>
          <div style={styles.detailCode}>
            {renderCompactRoot(expanded.treeData, compact)}
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div style={styles.error}>
              <span style={styles.errorText}>{error}</span>
              <button style={styles.errorClose} onClick={() => setError("")}>
                {"×"}
              </button>
            </div>
          )}

          {loading && (
            <div style={styles.loading}>
              <div className="grab-loading-bar-wrap">
                <div className="grab-loading-bar-inner" />
              </div>
              <div className="grab-loading-text">Scanning DOM</div>
            </div>
          )}

          {hasSearched && !loading && (
            <div style={styles.summaryRow}>
              <div style={styles.summaryLeft}>
                <label style={styles.checkWrap}>
                  <input type="checkbox" style={styles.checkbox}
                    checked={selCount === results.length && results.length > 0}
                    onChange={selectAll} />
                </label>
                <div style={count > 0 ? styles.summary : styles.empty}>
                  {count > 0
                    ? `${count} element${count > 1 ? "s" : ""} found`
                    : "0 elements found"}
                  {restored && count > 0 && selCount === 0 && (
                    <span style={styles.cached}>{" · cached"}</span>
                  )}
                </div>
              </div>
              <div style={styles.summaryRight}>
                {selCount > 0 && (
                  <button style={styles.clearSelBtn} onClick={clearSelection}>Clear</button>
                )}
                {count > 0 && <div style={styles.countBadge}>{count}</div>}
              </div>
            </div>
          )}

          {selCount > 0 && (
            <div style={styles.exportBar}>
              <span style={styles.exportHint}>
                {exportFmt.toUpperCase()} · {exportContent === "text" ? "Text only" : "Tree only"}
              </span>
              <button style={styles.exportBtn} onClick={handleExport}>
                Export {selCount} item{selCount > 1 ? "s" : ""}
              </button>
            </div>
          )}

          {!hasSearched && !loading && (
            <div style={styles.onboarding}>
              <div style={styles.onboardTitle}>Extract DOM content</div>
              <div style={styles.onboardDesc}>
                Enter a selector above and press Grab to extract
                matching elements from the current page.
              </div>
              <div style={styles.examplesGrid}>
                {examples.map((ex) => (
                  <button key={ex.sel} style={styles.exampleChip}
                    onClick={() => setSelector(ex.sel)}>
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSearched && (
            <div ref={resultsRef} style={styles.results} onScroll={recalcVisible}>
              <div style={{ height: totalHeight, position: "relative" }}>
                <div style={{
                  position: "absolute", top: offsetY, left: 0, right: 0,
                  display: "flex", flexDirection: "column", gap: 10
                }}>
                  {visibleResults.map((r) => (
                    <ResultCard key={r.index} result={r} compact={compact}
                      selected={selected.has(r.index)}
                      onToggle={toggleSelect}
                      onExpand={(item) => {
                        scrollPosRef.current = resultsRef.current?.scrollTop ?? 0
                        setExpanded(item)
                      }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </ThemeContext.Provider>
  )
}

export default IndexPopup
