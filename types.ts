export interface TreeNode {
  tag: string
  className: string
  elementId: string
  ownText: string
  children: TreeNode[]
  shadowChildren: TreeNode[]
}

export interface Result {
  index: number
  tagName: string
  tree: string
  treeData: TreeNode
  textContent: string
  matchedBy: string
}

export interface HistoryEntry {
  selector: string
  url: string
  timestamp: number
}
