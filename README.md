<div align="center">
  <img src="./assets/logo.png" alt="logo">
</div>

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Manifest-V3-green" alt="Manifest">
  <img src="https://img.shields.io/badge/Built_with-Plasmo-purple" alt="Plasmo">
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6" alt="TypeScript">
</div>

<div>
  English| <a href="./docs/README-zh.md">简体中文</a> 
</div>


## Intro

Grabber is a lightweight browser extension for extracting and inspecting DOM content from the current webpage using a custom selector language. 

## Features

- **Custom selector language** — class, id, tag, attribute selectors with regex support and AND/OR, descendant, direct-child operators
- **Interactive tree view** — collapsible DOM tree with colored tag names
- **Compact mode** — auto-hides wrapper nodes without direct text content
- **Search history** — records recent selectors and URLs.
- **Multi-select export** — select one or more results and export as JSON or TXT, with text-only or full tree options

## Selector Syntax

### Basic Selectors

| Type      | Example           | Description                                   |
|-----------|-------------------|-----------------------------------------------|
| class     | `.myclass`        | Elements with class `myclass`                 |
| id        | `#myid`           | Element with id `myid`                        |
| tag       | `<div>`           | All `<div>` elements                          |
| attr      | `[data-type]`     | Elements with attribute `data-type`           |
| attr val  | `[href^="https"]` | Attribute starts with / ends with / contains  |
| class re  | `.[btn-.*]`       | Elements with any class matching the regex    |
| id re     | `#[foo.*]`        | Element whose id matches the regex            |

### Attribute Selectors

Supports all standard CSS attribute selectors:

```bash
[hidden]              # Elements with a "hidden" attribute
[data-type="primary"] # Attribute exact match
[href^="https"]       # Attribute starts with
[src$=".png"]         # Attribute ends with
[class*="btn"]        # Attribute contains substring
[data-type] // <p>    # Combine with operators
```

### Regex Selectors

Use `.[pattern]` to match elements by class name regex, or `#[pattern]` to match by id regex. The pattern is a JavaScript regular expression.

```
.[^btn]           # Elements with a class starting with "btn"
#[section-\d+]    # Element with id like "section-1", "section-2"
.[active|disabled] # Elements with class "active" or "disabled"
```

### Operators (lowest to highest precedence)

| Operator | Example                     | Description                               |
|----------|-----------------------------|-------------------------------------------|
| `\|\|`   | `.a \|\| .b`               | OR — union of matches                     |
| `&&`     | `.a && .b`                  | AND — intersection of matches             |
| `//`     | `.a // .b`                  | Descendant — `.b` anywhere inside `.a`    |
| `/`      | `.a / .b`                   | Direct child — `.b` as immediate child of `.a` |
| `()`     | `(.a \|\| .b) && .c`       | Grouping with parentheses                 |

### Combined Examples

```bash
.container // .item && .active       # Active items inside container
(.a || .b) / <p>                     # Direct <p> children of .a or .b
ul // li                             # All list items inside unordered lists
.[^nav] // <a>                       # Links inside any element with class starting "nav"
div // [data-type="primary"]         # Elements with attribute inside divs
```

## Download

Download the latest packaged extension from the [Releases page](https://github.com/dolphinwesting248/Grabber/releases).

1. Download `Grabber.zip` from the latest release
2. Unzip the archive to a folder
3. Open `chrome://extensions/`
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the unzipped folder

## Build from Source

```bash
# Clone and install
git clone https://github.com/dolphinwesting248/Grabber.git
cd Grabber
npm install

# Build for production
npm run build
```

Then load in Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-prod/` directory

## Development

```bash
npm run dev
```

Load the `build/chrome-mv3-dev/` directory as an unpacked extension. Changes rebuild automatically.

## Tech Stack

- [Plasmo](https://www.plasmo.com/) — browser extension framework
- React 19 + TypeScript
- Chrome Extension Manifest V3

## License

MIT
