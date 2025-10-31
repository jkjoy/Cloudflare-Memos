/**
 * 获取 Broadcast 风格的内联 CSS 样式
 * 基于 BroadcastChannel 项目的设计
 */
export function getBroadcastStyles() {
  return `
:root {
  --background-color: #f4f1ec;
  --foreground-color: #000000;
  --highlight-color: orangered;
  --box-border-radius: 3px;
  --media-border-radius: 8px;
  --dot-size: 8px;
  --shadows: 0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.02), 0 8px 16px rgba(0, 0, 0, 0.02);
  --box-margin: 10px;
  --border-color: rgba(0, 0, 0, 0.05);
  --link-color: var(--highlight-color);
  --cell-background-color: #fff;
  --code-background-color: #f9f9f9;
  --secondary-color: #999;
}

* {
  -webkit-tap-highlight-color: transparent;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--background-color);
  color: var(--foreground-color);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  line-height: 1.6;
}

a {
  color: #778087;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #4d5256;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

/* 容器布局 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

.main-container {
  flex: 1;
  padding-top: 20px;
  padding-bottom: 20px;
  min-width: 0;
}

.aside-container {
  width: 200px;
  min-width: 200px;
  padding-bottom: 20px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.heatmap-container {
  width: 150px;
  min-width: 150px;
  padding: 16px;
  background: var(--cell-background-color);
  border-radius: var(--box-border-radius);
  box-shadow: var(--shadows);
  border: 1px solid var(--border-color);
  position: sticky;
  top: 20px;
  height: fit-content;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

/* Header 样式 */
.header {
  padding: 10px;
  margin-bottom: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  border: 3px solid #fff;
  box-shadow: var(--shadows);
  display: block;
  flex-shrink: 0;
}

.header-title {
  flex: 1;
  font-size: 20px;
  color: #333;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.header-title:hover {
  color: #000;
  text-decoration: underline;
}

/* 导航样式 */
.nav {
  padding-top: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--box-margin);
}

.nav-link {
  flex: 1;
  text-decoration: none;
  color: #333;
  padding: 5px 10px;
  border-radius: var(--box-border-radius);
  display: inline-block;
  transition: background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.nav-link.current, .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.75);
  box-shadow: var(--shadows);
  text-decoration: none;
}

/* Memo 时间线样式 */
.items {
  margin-top: 20px;
  margin-left: 28px;
}

.item {
  transition: 0.2s ease;
}

.time-box {
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.time-box > .dot {
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: var(--dot-size);
  background-color: var(--link-color);
}

.time-box > .time {
  flex: 1;
  color: var(--link-color);
  font-size: 14px;
  font-weight: 500;
  padding-left: 10px;
}

.memo-box {
  border-left: 2px solid var(--border-color);
  padding: 30px 0 30px 30px;
  margin-left: 3px;
}

.memo-box:last-child {
  padding-bottom: 60px;
}

.memo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.memo-avatar {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  border: 3px solid #fff;
  box-shadow: var(--shadows);
}

.memo-author-info {
  flex: 1;
}

.memo-author-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.memo-author-username {
  font-size: 14px;
  color: var(--secondary-color);
}

.memo-pinned-badge {
  background: var(--highlight-color);
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.memo-content {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.memo-resources {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.memo-resource {
  display: block;
  padding: 10px;
  background: var(--code-background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--box-border-radius);
  text-decoration: none;
  color: var(--secondary-color);
  transition: all 0.2s ease;
  font-size: 14px;
}

.memo-resource:hover {
  background: var(--cell-background-color);
  border-color: var(--link-color);
  color: var(--link-color);
  text-decoration: none;
  box-shadow: var(--shadows);
}

.memo-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.memo-link {
  color: var(--link-color);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: var(--box-border-radius);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.memo-link:hover {
  background: var(--cell-background-color);
  box-shadow: var(--shadows);
  text-decoration: none;
}

/* 表单样式 */
.form-card {
  background: var(--cell-background-color);
  border-radius: var(--box-border-radius);
  padding: 20px;
  box-shadow: var(--shadows);
  margin-bottom: 20px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.form-textarea, .form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--box-border-radius);
  background: var(--code-background-color);
  color: var(--foreground-color);
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

.form-textarea {
  min-height: 100px;
}

.form-textarea:focus, .form-input:focus {
  outline: none;
  border-color: var(--highlight-color);
  background: var(--cell-background-color);
}

.btn {
  padding: 10px 20px;
  background: var(--highlight-color);
  color: #fff;
  border: none;
  border-radius: var(--box-border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover {
  opacity: 0.9;
  box-shadow: var(--shadows);
}

.btn-secondary {
  background: var(--secondary-color);
}

.btn-outline {
  padding: 8px 24px;
  background: transparent;
  color: var(--secondary-color);
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  border-color: var(--secondary-color);
  color: var(--foreground-color);
  background: rgba(0, 0, 0, 0.02);
}

.pages-container {
  align-items: center;
  display: flex;
  margin-bottom: 20px;
  margin-top: 20px;
  justify-content: flex-start;
  padding-left: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--cell-background-color);
  border-radius: var(--box-border-radius);
  box-shadow: var(--shadows);
  color: var(--secondary-color);
}

.empty-state h3 {
  margin-bottom: 10px;
  color: #333;
}

/* 编辑器按钮 */
.editor-btn {
  padding: 6px 12px;
  background: var(--sepia-surface);
  border: 1px solid var(--sepia-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--sepia-text);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.editor-btn:hover {
  background: var(--sepia-accent);
  color: var(--sepia-surface);
  border-color: var(--sepia-accent);
}

.editor-btn:active {
  transform: scale(0.95);
}

/* Markdown 内容样式 */
.markdown-content {
  line-height: 1.6;
  color: var(--sepia-text);
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: var(--sepia-accent);
}

.markdown-content h1 { font-size: 2em; }
.markdown-content h2 { font-size: 1.5em; }
.markdown-content h3 { font-size: 1.25em; }
.markdown-content h4 { font-size: 1.1em; }
.markdown-content h5 { font-size: 1em; }
.markdown-content h6 { font-size: 0.9em; }

.markdown-content p {
  margin-bottom: 1em;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 1em;
  padding-left: 2em;
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content code {
  background: var(--code-background-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
  color: #e74c3c;
}

.markdown-content pre {
  background: var(--code-background-color);
  padding: 12px;
  border-radius: var(--box-border-radius);
  overflow-x: auto;
  margin-bottom: 1em;
  border: 1px solid var(--border-color);
}

.markdown-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.markdown-content blockquote {
  border-left: 4px solid var(--sepia-accent);
  padding-left: 16px;
  margin: 1em 0;
  color: var(--sepia-text-muted);
  font-style: italic;
}

/* Markdown 图片 - 9宫格网格 */
.markdown-images-grid {
  display: grid;
  grid-template-columns: repeat(3, 200px);
  gap: 10px;
  margin: 1em 0;
}

.markdown-images-grid > div {
  width: 200px;
  height: 200px;
  overflow: hidden;
  border-radius: var(--media-border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadows);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.markdown-images-grid > div:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-images-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 单张图片 */
.markdown-content > p > img:only-child {
  max-width: 100%;
  height: auto;
  border-radius: var(--media-border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadows);
  margin: 1em 0;
  display: block;
  cursor: pointer;
}

.markdown-content a {
  color: var(--sepia-accent);
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content th {
  background: var(--code-background-color);
  font-weight: 600;
}

.markdown-content hr {
  border: none;
  border-top: 2px solid var(--border-color);
  margin: 2em 0;
}

/* 热力图样式 */
.heatmap-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1.5px;
  margin-bottom: 12px;
}

.heatmap-cell {
  width: 100%;
  padding-bottom: 100%;
  position: relative;
  background: var(--code-background-color);
  border-radius: 1px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.heatmap-cell[data-level="0"] {
  background: #ebedf0;
}

.heatmap-cell[data-level="1"] {
  background: #c6e48b;
}

.heatmap-cell[data-level="2"] {
  background: #7bc96f;
}

.heatmap-cell[data-level="3"] {
  background: #239a3b;
}

.heatmap-cell[data-level="4"] {
  background: #196127;
}

.heatmap-cell:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  z-index: 1;
  border-radius: 3px;
}

.heatmap-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  display: none;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  font-size: 12px;
  color: var(--secondary-color);
  margin-top: 12px;
}

.heatmap-legend-item {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* 页脚 */
.footer {
  text-align: center;
  padding: 20px;
  color: var(--secondary-color);
  font-size: 14px;
}

/* 响应式 */
/* 中等屏幕 - 先隐藏热力图 */
@media screen and (max-width: 1024px) {
  .heatmap-container {
    display: none;
  }

  .container {
    max-width: 900px;
  }
}

/* 小屏幕 - 重新布局导航 */
@media screen and (max-width: 600px) {
  .container {
    flex-direction: column-reverse;
    padding: 10px 20px;
  }

  .main-container {
    padding-right: 0;
    padding-top: 10px;
    margin-right: 0;
    border-right: none;
    width: 100%;
  }

  .aside-container {
    width: 100%;
    position: static;
    height: auto;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
    padding-top: 20px;
    background-color: var(--background-color);
  }

  .heatmap-container {
    display: none;
  }

  .nav {
    padding-top: 10px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .nav-item {
    font-size: 14px;
    margin-bottom: 0;
  }

  .nav-link {
    padding: 10px 12px;
    border-radius: var(--box-border-radius);
    background-color: var(--cell-background-color);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    background-color: var(--background-color);
    border-color: var(--highlight-color);
    text-decoration: none;
  }

  .nav-link.current {
    background-color: var(--highlight-color);
    color: white;
    border-color: var(--highlight-color);
  }

  .nav-link.current svg {
    stroke: white;
  }

  .nav-link svg {
    flex-shrink: 0;
  }

  /* 欢迎文字占满一行 */
  .nav-item:has(#welcomeText) {
    grid-column: 1 / -1;
    text-align: center;
    padding: 8px 0;
    margin-top: 0;
  }

  /* 底部工具栏 */
  .nav-item:has(a[href="/rss.xml"]) {
    grid-column: 1 / -1;
    justify-content: center;
    margin-top: 0;
  }

  .items {
    margin-left: 0;
  }

  .memo-box {
    padding-left: 20px;
  }

  .header {
    padding: 0;
    margin-bottom: 15px;
  }

  .header-title {
    font-size: 18px;
  }
}
`;
}
