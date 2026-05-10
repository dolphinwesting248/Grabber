import { useState, useEffect, useRef, useCallback } from "react"
import type { HistoryEntry } from "../types"
import { INITIAL_BATCH } from "../lib/theme"

export function useHistory(onSelect: (entry: HistoryEntry) => void) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyCount, setHistoryCount] = useState(10)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyBatch, setHistoryBatch] = useState(INITIAL_BATCH)
  const [currentUrl, setCurrentUrl] = useState("")
  const historyRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  // restore from storage + fetch current tab URL
  useEffect(() => {
    Promise.all([
      chrome.storage.local.get(["history", "historyCount"]),
      chrome.tabs.query({ active: true, currentWindow: true })
    ]).then(([data, tabs]) => {
      const saved = data.history as HistoryEntry[] | undefined
      const savedCount = data.historyCount as number | undefined
      if (saved) setHistory(saved)
      if (savedCount !== undefined) setHistoryCount(savedCount)
      if (tabs[0]?.url) setCurrentUrl(tabs[0].url)
      loadedRef.current = true
    })
  }, [])

  // persist historyCount (skip initial write before restore completes)
  useEffect(() => {
    if (!loadedRef.current) return
    chrome.storage.local.set({ historyCount })
  }, [historyCount])

  // trim when historyCount decreases
  useEffect(() => {
    setHistory((prev) => {
      if (prev.length <= historyCount) return prev
      const trimmed = prev.slice(0, historyCount)
      chrome.storage.local.set({ history: trimmed })
      return trimmed
    })
  }, [historyCount])

  const addHistoryEntry = useCallback((selector: string, url: string) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.selector === selector && h.url === url)
      )
      const next = [
        { selector, url, timestamp: Date.now() },
        ...filtered
      ].slice(0, historyCount)
      chrome.storage.local.set({ history: next })
      return next
    })
  }, [historyCount])

  const handleHistoryClick = useCallback((entry: HistoryEntry) => {
    onSelect(entry)
    setHistoryOpen(false)
  }, [onSelect])

  const handleHistoryDelete = useCallback((e: React.MouseEvent, entry: HistoryEntry) => {
    e.stopPropagation()
    setHistory((prev) => {
      const next = prev.filter((h) => h !== entry)
      chrome.storage.local.set({ history: next })
      return next
    })
  }, [])

  const handleInputFocus = useCallback(() => {
    if (history.length > 0) {
      setHistoryBatch(INITIAL_BATCH)
      setHistoryOpen(true)
    }
  }, [history.length])

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setHistoryOpen(false), 150)
  }, [])

  const handleShowMore = useCallback((total: number) => {
    setHistoryBatch((b) => Math.min(total, b + INITIAL_BATCH))
  }, [])

  // sort: current URL matches first, then by recency
  const sortedHistory = currentUrl
    ? [...history].sort((a, b) => {
        const aMatch = a.url === currentUrl ? 0 : 1
        const bMatch = b.url === currentUrl ? 0 : 1
        if (aMatch !== bMatch) return aMatch - bMatch
        return b.timestamp - a.timestamp
      })
    : history

  const displayedHistory = sortedHistory.slice(0, historyBatch)
  const hasMoreHistory = sortedHistory.length > historyBatch
  const remainingCount = sortedHistory.length - historyBatch

  return {
    history,
    historyCount,
    setHistoryCount,
    historyOpen,
    currentUrl,
    displayedHistory,
    hasMoreHistory,
    remainingCount,
    addHistoryEntry,
    handleHistoryClick,
    handleHistoryDelete,
    handleInputFocus,
    handleInputBlur,
    handleShowMore,
    historyRef,
  }
}
