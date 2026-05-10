export const CARD_HEIGHT = 220
export const OVERSCAN = 2
export const INITIAL_BATCH = 8

export const FONT =
  "'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'Menlo', monospace"

export const themeCSS = `
[data-theme="dark"] {
  --bg: #0f0f0f;
  --surface: #181818;
  --raised: #1f1f1f;
  --border: #2a2a2a;
  --border-light: #333;
  --text: #d4d4d4;
  --text-dim: #a0a0a0;
  --text-muted: #4a4a4a;
  --accent: #d4a853;
  --accent-dim: #3d3628;
  --accent-muted: #2a2518;
  --red: #e05555;
  --red-bg: #2a1a1a;
  --btn-text: #0f0f0f;
  --scrollbar: #d4a853;
  --scrollbar-hover: #d4a853CC;
}
[data-theme="light"] {
  --bg: #f6f6f4;
  --surface: #ffffff;
  --raised: #f0f0ee;
  --border: #e0e0dc;
  --border-light: #d4d4d0;
  --text: #2c2c2c;
  --text-dim: #8a8a8a;
  --text-muted: #bcbcbc;
  --accent: #9b6806;
  --accent-dim: #faecc8;
  --accent-muted: #fdf6e8;
  --red: #d64040;
  --red-bg: #fef0f0;
  --btn-text: #ffffff;
  --scrollbar: #9b6806;
  --scrollbar-hover: #9b6806CC
}
html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  border: none;
  outline: none;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--scrollbar);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-hover);
}
@keyframes grab-scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
@keyframes grab-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@keyframes grab-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.grab-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(212,168,83,0.3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: grab-spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}
.grab-loading-bar-wrap {
  position: relative;
  height: 2px;
  background: var(--border);
  border-radius: 1px;
  overflow: hidden;
}
.grab-loading-bar-inner {
  width: 25%;
  height: 100%;
  background: var(--accent);
  border-radius: 1px;
  animation: grab-scan 1.4s ease-in-out infinite;
}
.stepper-input::-webkit-outer-spin-button,
.stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.stepper-input {
  -moz-appearance: textfield;
}
.grab-loading-text {
  text-align: center;
  color: var(--text);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  animation: grab-pulse 1.2s ease-in-out infinite;
  margin-top: 10px;
}
`
