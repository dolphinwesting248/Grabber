export function grabPageDOM(s: string) {
  try {
    // ---- helpers ----
    function getOwnText(el: Element): string {
      let text = ""
      for (const child of el.childNodes) {
        if (child.nodeType === 3) {
          text += child.textContent || ""
        }
      }
      return text.trim()
    }

    function getChildren(el: Element): Element[] {
      return Array.from(el.children).filter((c) => c.tagName !== "STYLE")
    }

    function hasShadow(el: Element): boolean {
      return !!(el as any).shadowRoot
    }

    function getShadowChildren(el: Element): Element[] {
      const sr = (el as any).shadowRoot
      return sr
        ? Array.from(sr.children).filter((c) => c.tagName !== "STYLE")
        : []
    }

    const MAX_NODES = 50000
    let nodeCount = 0

    function walkAll(
      root: Document | Element | ShadowRoot,
      callback: (el: Element) => void
    ) {
      const children = Array.from(root.children)
      for (const el of children) {
        if (++nodeCount > MAX_NODES) {
          throw new Error(`DOM node limit exceeded (${MAX_NODES})`)
        }
        if (el.tagName === "STYLE") continue
        callback(el)
        if ((el as any).shadowRoot) {
          walkAll((el as any).shadowRoot, callback)
        }
        walkAll(el, callback)
      }
    }

    // ---- tree building ----
    interface RawNode {
      tag: string
      className: string
      elementId: string
      ownText: string
      children: RawNode[]
      shadowChildren: RawNode[]
    }

    function buildTreeData(el: Element): RawNode {
      return {
        tag: el.tagName.toLowerCase(),
        className: el.className && typeof el.className === "string" ? el.className.trim() : "",
        elementId: el.id || "",
        ownText: getOwnText(el),
        children: getChildren(el).map(buildTreeData),
        shadowChildren: hasShadow(el)
          ? getShadowChildren(el).map(buildTreeData)
          : []
      }
    }

    function attrLabel(node: RawNode): string {
      const parts: string[] = []
      if (node.elementId) parts.push("#" + node.elementId)
      if (node.className) parts.push("." + node.className.replace(/\s+/g, " ."))
      return parts.join(" ")
    }

    // Keep in sync with compactText in lib/compact-logic.ts — cannot be imported
    // because this entire function is serialized via chrome.scripting.executeScript.
    function buildTreeText(
      node: RawNode,
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
          result += buildTreeText(child, childPrefix, true)
        } else {
          const childPrefix = prefix + (isLast ? "  " : "│ ")
          result += buildTreeText(child, childPrefix, childLast)
        }
      })

      return result
    }

    // ---- expression parser ----
    function css(p: string): string {
      return p.replace(/<([\w-]+)>/g, "$1").trim()
    }

    function queryAll(sel: string): Set<Element> {
      const s = css(sel)

      // Regex class: .[pattern]
      const classRe = s.match(/^\.\[(.+)\]$/)
      if (classRe) {
        const re = new RegExp(classRe[1])
        const result = new Set<Element>()
        walkAll(document, (el) => {
          for (const cls of el.classList) {
            if (re.test(cls)) { result.add(el); break }
          }
        })
        return result
      }

      // Regex id: #[pattern]
      const idRe = s.match(/^#\[(.+)\]$/)
      if (idRe) {
        const re = new RegExp(idRe[1])
        const result = new Set<Element>()
        walkAll(document, (el) => {
          if (re.test(el.id)) result.add(el)
        })
        return result
      }

      // Standard CSS selector
      const result = new Set<Element>()
      walkAll(document, (el) => {
        try {
          if (el.matches(s)) result.add(el)
        } catch {}
      })
      return result
    }

    type Op = "||" | "&&" | "//" | "/"
    type AST =
      | { type: "sel"; value: string }
      | { type: "op"; op: Op; left: AST; right: AST }

    function tokenize(input: string): string[] {
      const re = /(\|\||&&|\/\/|\/|\(|\))/g
      const toks: string[] = []
      let last = 0
      let m: RegExpExecArray | null
      while ((m = re.exec(input)) !== null) {
        if (m.index > last)
          toks.push(input.slice(last, m.index).trim())
        toks.push(m[0])
        last = m.index + m[0].length
      }
      const tail = input.slice(last).trim()
      if (tail) toks.push(tail)
      return toks.filter(Boolean)
    }

    function parse(input: string): AST {
      const toks = tokenize(input)
      let pos = 0

      function peek() {
        return toks[pos]
      }
      function next() {
        return toks[pos++]
      }

      function parseExpr(): AST {
        let left = parseAnd()
        while (peek() === "||") {
          next()
          left = { type: "op", op: "||", left, right: parseAnd() }
        }
        return left
      }
      function parseAnd(): AST {
        let left = parseDesc()
        while (peek() === "&&") {
          next()
          left = { type: "op", op: "&&", left, right: parseDesc() }
        }
        return left
      }
      function parseDesc(): AST {
        let left = parseChild()
        while (peek() === "//") {
          next()
          left = { type: "op", op: "//", left, right: parseChild() }
        }
        return left
      }
      function parseChild(): AST {
        let left = parseAtom()
        while (peek() === "/") {
          next()
          left = { type: "op", op: "/", left, right: parseAtom() }
        }
        return left
      }
      function parseAtom(): AST {
        if (peek() === "(") {
          next()
          const node = parseExpr()
          next()
          return node
        }
        return { type: "sel", value: css(next()) }
      }
      return parseExpr()
    }

    function evalAST(node: AST): Set<Element> {
      if (node.type === "sel") {
        return queryAll(node.value)
      }
      const op = node.op
      const left = evalAST(node.left)

      if (op === "||") {
        const right = evalAST(node.right)
        for (const el of right) left.add(el)
        return left
      }
      if (op === "&&") {
        const right = evalAST(node.right)
        const result = new Set<Element>()
        for (const el of left) if (right.has(el)) result.add(el)
        return result
      }
      const candidates = evalAST(node.right)
      const result = new Set<Element>()
      for (const c of left) {
        if (op === "/") {
          for (const child of Array.from(c.children)) {
            if (candidates.has(child)) result.add(child)
          }
        } else {
          walkAll(c, (el) => {
            if (el !== c && candidates.has(el)) result.add(el)
          })
        }
      }
      return result
    }

    function splitTopLevelOr(input: string): string[] {
      const parts: string[] = []
      let depth = 0, bdepth = 0, start = 0
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "(") depth++
        else if (input[i] === ")") depth--
        else if (input[i] === "[") bdepth++
        else if (input[i] === "]") bdepth--
        else if (
          depth === 0 &&
          bdepth === 0 &&
          input[i] === "|" &&
          input[i + 1] === "|"
        ) {
          parts.push(input.slice(start, i).trim())
          start = i + 2
          i++
        }
      }
      parts.push(input.slice(start).trim())
      return parts
    }

    interface Match {
      el: Element
      matchedBy: string
    }

    function query(s: string): Match[] {
      const orParts = splitTopLevelOr(s)
      const results: Match[] = []
      const seen = new Set<Element>()

      for (const part of orParts) {
        const tree = parse(part)
        const elements = evalAST(tree)
        for (const el of elements) {
          if (!seen.has(el)) {
            seen.add(el)
            results.push({ el, matchedBy: part })
          }
        }
      }
      return results
    }

    // ---- execute ----
    const matches = query(s)
    return {
      success: true as const,
      count: matches.length,
      results: matches.map(({ el, matchedBy }, i) => {
        const treeData = buildTreeData(el)
        return {
          index: i,
          tagName: el.tagName.toLowerCase(),
          tree: buildTreeText(treeData, "", true).trimEnd(),
          treeData,
          textContent: el.textContent?.trim() || "",
          matchedBy
        }
      })
    }
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
