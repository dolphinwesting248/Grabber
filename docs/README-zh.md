<div align="center">
  <img src="../assets/logo.png" alt="logo">
</div>

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Manifest-V3-green" alt="Manifest">
  <img src="https://img.shields.io/badge/Built_with-Plasmo-purple" alt="Plasmo">
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6" alt="TypeScript">
</div>
<div>
  <a href="../README.md">English</a> | 简体中文
</div>


## 介绍

Grabber 是一款轻量级浏览器插件，用于通过自定义选择器语言提取和检查当前网页的 DOM 内容。

## 特性

- **自定义选择器语言** — 支持类、ID、标签、属性选择器，包含正则表达式支持以及 AND/OR、后代、直接子代运算符
- **交互式树形视图** — 可折叠的 DOM 树，标签名称带有颜色高亮
- **紧凑模式** — 自动隐藏没有直接文本内容的包装节点
- **搜索历史** — 记录最近使用的选择器和 URL
- **多选导出** — 选择一个或多个结果，导出为 JSON 或 TXT，可选仅文本或完整树结构

## 选择器语法

### 基本选择器

| 类型    | 示例              | 描述                                 |
| ------- | ----------------- | ------------------------------------ |
| 类      | `.myclass`        | 类名为 `myclass` 的元素              |
| ID      | `#myid`           | ID 为 `myid` 的元素                  |
| 标签    | `<div>`           | 所有 `<div>` 元素                    |
| 属性    | `[data-type]`     | 拥有属性 `data-type` 的元素          |
| 属性值  | `[href^="https"]` | 属性以...开头/以...结尾/包含...      |
| 类正则  | `.[btn-.*]`       | 任何一个类名匹配给定正则表达式的元素 |
| ID 正则 | `#[foo.*]`        | ID 匹配给定正则表达式的元素          |

### 属性选择器

支持所有标准 CSS 属性选择器：

```bash
[hidden]              # 拥有 "hidden" 属性的元素
[data-type="primary"] # 属性精确匹配
[href^="https"]       # 属性以指定值开头
[src$=".png"]         # 属性以指定值结尾
[class*="btn"]        # 属性包含子字符串
[data-type] // <p>    # 与运算符结合使用
```

### 正则选择器

使用 `.[pattern]` 按类名正则表达式匹配元素，或使用 `#[pattern]` 按 ID 正则表达式匹配。pattern 是一个 JavaScript 正则表达式。

```
.[^btn]           # 类名以 "btn" 开头的元素
#[section-\d+]    # ID 类似于 "section-1"、"section-2" 的元素
.[active|disabled] # 类名为 "active" 或 "disabled" 的元素
```

### 运算符（优先级从低到高）

| 运算符 | 示例                 | 描述                                 |
| ------ | -------------------- | ------------------------------------ |
| `\|\|` | `.a \|\| .b`         | OR — 并集                            |
| `&&`   | `.a && .b`           | AND — 交集                           |
| `//`   | `.a // .b`           | 后代 — `.b` 在 `.a` 内的任意位置     |
| `/`    | `.a / .b`            | 直接子代 — `.b` 是 `.a` 的直接子元素 |
| `()`   | `(.a \|\| .b) && .c` | 使用括号分组                         |

### 组合示例

```bash
.container // .item && .active       # 容器内的活动项
(.a || .b) / <p>                     # .a 或 .b 的直接 <p> 子元素
ul // li                             # 无序列表中的所有列表项
.[^nav] // <a>                       # 任何类名以 "nav" 开头的元素中的链接
div // [data-type="primary"]         # div 内拥有特定属性的元素
```

## 下载

从 [Releases 页面](https://github.com/dolphinwesting248/Grabber/releases) 下载最新打包的扩展。

1.  下载最新版本中的 `Grabber.zip`
2.  将压缩包解压到一个文件夹
3.  打开 `chrome://extensions/`
4.  启用 **开发者模式**
5.  点击 **加载已解压的扩展程序**
6.  选择解压后的文件夹

## 从源码构建

```bash
# 克隆并安装依赖
git clone https://github.com/dolphinwesting248/Grabber.git
cd Grabber
npm install

# 构建生产版本
npm run build
```

然后在 Chrome 中加载：
1.  打开 `chrome://extensions/`
2.  启用 **开发者模式**
3.  点击 **加载已解压的扩展程序**
4.  选择 `build/chrome-mv3-prod/` 目录

## 开发

```bash
npm run dev
```

将 `build/chrome-mv3-dev/` 目录作为已解压的扩展程序加载。代码更改会自动重新构建。

## 技术栈

- [Plasmo](https://www.plasmo.com/) — 浏览器扩展框架
- React 19 + TypeScript
- Chrome 扩展 Manifest V3

## 许可证

MIT