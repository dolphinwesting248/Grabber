import { useState, useEffect } from "react"
import styles from "../styles"

export function SettingsPanel({
  threshold,
  setThreshold,
  exportFmt,
  setExportFmt,
  exportContent,
  setExportContent,
  historyCount,
  setHistoryCount
}: {
  threshold: number
  setThreshold: (t: number) => void
  exportFmt: "json" | "txt"
  setExportFmt: (v: "json" | "txt") => void
  exportContent: "text" | "tree"
  setExportContent: (v: "text" | "tree") => void
  historyCount: number
  setHistoryCount: (v: number) => void
}) {
  const [inputValue, setInputValue] = useState(String(threshold))
  const [error, setError] = useState("")
  const [histInputValue, setHistInputValue] = useState(String(historyCount))
  const [histError, setHistError] = useState("")

  useEffect(() => {
    setInputValue(String(threshold))
  }, [threshold])

  useEffect(() => {
    setHistInputValue(String(historyCount))
  }, [historyCount])

  const commit = (raw: string) => {
    const v = Number(raw)
    if (raw === "" || isNaN(v)) return
    const clamped = Math.max(1, Math.min(500, v))
    setThreshold(clamped)
    if (v < 1 || v > 500) {
      setError("Value must be 1–500")
    } else {
      setError("")
    }
  }

  const handleChange = (raw: string) => {
    setInputValue(raw)
    const v = Number(raw)
    if (raw !== "" && !isNaN(v)) {
      setThreshold(v)
      if (v < 1 || v > 500) {
        setError("Value must be 1–500")
      } else {
        setError("")
      }
    }
  }

  const handleBlur = () => {
    const v = Number(inputValue)
    if (inputValue === "" || isNaN(v)) {
      setInputValue(String(threshold))
    } else if (v < 1) {
      setInputValue("1")
      setThreshold(1)
    } else if (v > 500) {
      setInputValue("500")
      setThreshold(500)
    }
    setError("")
  }

  const handleHistChange = (raw: string) => {
    setHistInputValue(raw)
    const v = Number(raw)
    if (raw !== "" && !isNaN(v)) {
      setHistoryCount(v)
      if (v < 1 || v > 50) {
        setHistError("Value must be 1–50")
      } else {
        setHistError("")
      }
    }
  }

  const handleHistBlur = () => {
    const v = Number(histInputValue)
    if (histInputValue === "" || isNaN(v)) {
      setHistInputValue(String(historyCount))
    } else if (v < 1) {
      setHistInputValue("1")
      setHistoryCount(1)
    } else if (v > 50) {
      setHistInputValue("50")
      setHistoryCount(50)
    }
    setHistError("")
  }

  return (
    <div style={styles.settingsPage}>
      <div style={styles.settingsGroup}>
        <label style={styles.settingsLabel}>Persistence threshold</label>
        <div style={styles.settingsHint}>
          Results exceeding this count are not saved to local storage
        </div>
        <div style={styles.stepper}>
          <button
            style={styles.stepperBtn}
            onClick={() => {
              setError("")
              setThreshold(Math.max(1, threshold - 10))
            }}>
            {"−"}
          </button>
          <div style={styles.stepperValue}>
            <input
              type="number"
              className="stepper-input"
              style={{
                ...styles.stepperInput,
                ...(error ? { color: "var(--red)" } : {})
              }}
              value={inputValue}
              min={1}
              max={500}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
            />
          </div>
          <button
            style={styles.stepperBtn}
            onClick={() => {
              setError("")
              setThreshold(Math.min(500, threshold + 10))
            }}>
            {"+"}
          </button>
        </div>
        {error && <div style={styles.fieldError}>{error}</div>}
      </div>

      <div style={styles.settingsSection}>
        <label style={styles.settingsLabel}>Export defaults</label>
        <div style={styles.settingsHint}>
          Default format and content for result export
        </div>
        <div style={styles.toggleGroup}>
          <button
            style={exportFmt === "json" ? styles.toggleOn : styles.toggleOff}
            onClick={() => setExportFmt("json")}>
            JSON
          </button>
          <button
            style={exportFmt === "txt" ? styles.toggleOn : styles.toggleOff}
            onClick={() => setExportFmt("txt")}>
            TXT
          </button>
        </div>
        <div style={styles.toggleGroup}>
          <button
            style={exportContent === "text" ? styles.toggleOn : styles.toggleOff}
            onClick={() => setExportContent("text")}>
            Text only
          </button>
          <button
            style={exportContent === "tree" ? styles.toggleOn : styles.toggleOff}
            onClick={() => setExportContent("tree")}>
            Tree only
          </button>
        </div>
      </div>

      <div style={styles.settingsSection}>
        <label style={styles.settingsLabel}>History size</label>
        <div style={styles.settingsHint}>
          Number of recent search entries to keep
        </div>
        <div style={styles.stepper}>
          <button
            style={styles.stepperBtn}
            onClick={() => {
              setHistError("")
              setHistoryCount(Math.max(1, historyCount - 5))
            }}>
            {"−"}
          </button>
          <div style={styles.stepperValue}>
            <input
              type="number"
              className="stepper-input"
              style={{
                ...styles.stepperInput,
                ...(histError ? { color: "var(--red)" } : {})
              }}
              value={histInputValue}
              min={1}
              max={50}
              onChange={(e) => handleHistChange(e.target.value)}
              onBlur={handleHistBlur}
            />
          </div>
          <button
            style={styles.stepperBtn}
            onClick={() => {
              setHistError("")
              setHistoryCount(Math.min(50, historyCount + 5))
            }}>
            {"+"}
          </button>
        </div>
        {histError && <div style={styles.fieldError}>{histError}</div>}
      </div>
    </div>
  )
}
