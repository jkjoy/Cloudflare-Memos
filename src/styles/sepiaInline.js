// Sepia Template Styles - 内联到 HTML
export function getSepiaStyles() {
  return `
:root {
  --sepia-bg: #f4f1ea;
  --sepia-surface: #faf8f3;
  --sepia-text: #3d3d3d;
  --sepia-text-light: #6b6b6b;
  --sepia-text-muted: #999999;
  --sepia-border: #d4c5a9;
  --sepia-accent: #8b7355;
  --sepia-accent-hover: #6d5940;
  --sepia-link: #7d6b5a;
  --sepia-link-hover: #5a4d3f;
  --sepia-shadow: rgba(61, 61, 61, 0.08);
  --sepia-shadow-hover: rgba(61, 61, 61, 0.12);
  --font-serif: 'Georgia', 'Times New Roman', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --radius-sm: 3px;
  --radius-md: 6px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-serif);
  line-height: 1.7;
  color: var(--sepia-text);
  background-color: var(--sepia-bg);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-serif);
  font-weight: 600;
  color: var(--sepia-text);
}

a {
  color: var(--sepia-link);
  text-decoration: none;
  transition: color 150ms ease;
}

a:hover {
  color: var(--sepia-link-hover);
}

.sepia-container {
  max-width: 680px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-md);
}

.sepia-header {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-md);
  background-color: var(--sepia-surface);
  border-bottom: 1px solid var(--sepia-border);
  margin-bottom: var(--spacing-xl);
}

.sepia-header h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
  color: var(--sepia-accent);
}

.sepia-nav {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  flex-wrap: wrap;
  margin-top: var(--spacing-lg);
}

.sepia-nav a {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sepia-text-light);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--sepia-border);
  border-radius: var(--radius-sm);
  transition: all 250ms ease;
}

.sepia-nav a:hover {
  text-decoration: none;
  background-color: var(--sepia-accent);
  color: var(--sepia-surface);
}

.sepia-card {
  background-color: var(--sepia-surface);
  border: 1px solid var(--sepia-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  box-shadow: 0 2px 4px var(--sepia-shadow);
  transition: all 250ms ease;
}

.sepia-card:hover {
  box-shadow: 0 4px 8px var(--sepia-shadow-hover);
  transform: translateY(-2px);
}

.sepia-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--sepia-border);
}

.sepia-author {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.sepia-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--sepia-border);
}

.sepia-author-name {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--sepia-text);
}

.sepia-author-username {
  font-size: 0.85rem;
  color: var(--sepia-text-muted);
}

.sepia-meta {
  font-size: 0.85rem;
  color: var(--sepia-text-muted);
  font-family: var(--font-sans);
}

.sepia-content {
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: var(--spacing-md);
}

.sepia-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.sepia-tag {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--sepia-bg);
  border: 1px solid var(--sepia-border);
  border-radius: var(--radius-sm);
  color: var(--sepia-text-light);
}

.sepia-tag:hover {
  background-color: var(--sepia-accent);
  color: var(--sepia-surface);
  border-color: var(--sepia-accent);
}

.sepia-btn {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--sepia-accent);
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--sepia-accent);
  cursor: pointer;
  transition: all 250ms ease;
}

.sepia-btn:hover {
  background-color: var(--sepia-accent);
  color: var(--sepia-surface);
  text-decoration: none;
}

.sepia-btn-primary {
  background-color: var(--sepia-accent);
  color: var(--sepia-surface);
}

.sepia-pinned {
  border-left: 3px solid var(--sepia-accent);
}

.sepia-pinned-badge {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--sepia-accent);
  font-weight: 600;
}

.sepia-form-card {
  background-color: var(--sepia-surface);
  border: 1px solid var(--sepia-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.sepia-form-group {
  margin-bottom: var(--spacing-lg);
}

.sepia-form-label {
  display: block;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.sepia-form-input,
.sepia-form-textarea {
  width: 100%;
  font-family: var(--font-serif);
  font-size: 1rem;
  padding: var(--spacing-md);
  border: 1px solid var(--sepia-border);
  border-radius: var(--radius-sm);
  background-color: white;
  color: var(--sepia-text);
}

.sepia-form-input:focus,
.sepia-form-textarea:focus {
  outline: none;
  border-color: var(--sepia-accent);
}

.sepia-form-textarea {
  min-height: 120px;
  resize: vertical;
}

.sepia-empty {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--sepia-text-muted);
}

.sepia-footer {
  text-align: center;
  padding: var(--spacing-xl) 0;
  margin-top: var(--spacing-2xl);
  border-top: 1px solid var(--sepia-border);
  color: var(--sepia-text-muted);
  font-size: 0.9rem;
  font-family: var(--font-sans);
}

@media (max-width: 768px) {
  .sepia-header h1 { font-size: 2rem; }
  .sepia-card { padding: var(--spacing-lg); }
  .sepia-card-header { flex-direction: column; gap: var(--spacing-sm); }
}
`;
}
