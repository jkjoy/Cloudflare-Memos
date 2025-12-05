import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';
import { getGravatarUrl } from '../utils/gravatar.js';

/**
 * 生成广场页面 HTML - 展示所有公开的备忘录
 */
export async function getExplorePageHTML(request, env) {
  try {
    const db = env.DB;

    // 获取网站设置
    const siteSettings = await getSiteSettings(env);

    // 获取公开的memos
    const limit = 20;
    const offset = 0;

    // 查询总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM memos m
      WHERE m.row_status = 'NORMAL' AND m.visibility = 'PUBLIC'
    `);
    const { total } = await countStmt.first();
    const hasMore = total > limit;

    const stmt = db.prepare(`
      SELECT
        m.id,
        m.row_status as rowStatus,
        m.creator_id as creatorId,
        m.created_ts as createdTs,
        m.updated_ts as updatedTs,
        m.display_ts as displayTs,
        m.content,
        m.visibility,
        m.pinned,
        m.parent_id as parent,
        u.nickname as creatorName,
        u.username as creatorUsername,
        u.email as creatorEmail
      FROM memos m
      LEFT JOIN users u ON m.creator_id = u.id
      WHERE m.row_status = 'NORMAL' AND m.visibility = 'PUBLIC'
      ORDER BY m.pinned DESC, m.display_ts DESC
      LIMIT ? OFFSET ?
    `);

    const { results: memos } = await stmt.bind(limit, offset).all();

    // 获取每个memo的资源列表和标签
    for (let memo of memos) {
      const resourceStmt = db.prepare(`
        SELECT r.id, r.filename, r.filepath, r.type, r.size
        FROM resources r
        JOIN memo_resources mr ON r.id = mr.resource_id
        WHERE mr.memo_id = ?
      `);
      const { results: resources } = await resourceStmt.bind(memo.id).all();

      memo.resourceList = (resources || []).map(r => ({
        ...r,
        filepath: r.filepath.startsWith('http') || r.filepath.startsWith('/api/')
          ? r.filepath
          : `/api/v1/resource/${r.id}/file`
      }));

      const tagStmt = db.prepare(`
        SELECT t.id, t.name
        FROM tags t
        JOIN memo_tags mt ON t.id = mt.tag_id
        WHERE mt.memo_id = ?
      `);
      const { results: tags } = await tagStmt.bind(memo.id).all();
      memo.tagList = tags || [];

      memo.pinned = Boolean(memo.pinned);
    }

    // 生成 memo 列表 HTML
    let memoListHTML = '';
    if (Array.isArray(memos) && memos.length > 0) {
      memoListHTML = '<div class="items">';

      for (const memo of memos) {
        const avatarUrl = getGravatarUrl(memo.creatorEmail, 40, env);
        const date = new Date(memo.createdTs * 1000);
        const dateStr = date.toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'});

        const imageResources = memo.resourceList ? memo.resourceList.filter(r => r.type && r.type.startsWith('image/')) : [];
        const otherResources = memo.resourceList ? memo.resourceList.filter(r => !r.type || !r.type.startsWith('image/')) : [];

        const imageCount = imageResources.length;
        let gridColumns = 3;
        if (imageCount === 1) {
          gridColumns = 1;
        } else if (imageCount === 2) {
          gridColumns = 2;
        } else if (imageCount === 4) {
          gridColumns = 2;
        }

        const imagesHTML = imageResources.length > 0 ?
          `<div class="image-grid" style="display: grid; grid-template-columns: repeat(${gridColumns}, 1fr); max-width: 100%; gap: 10px; margin-top: 16px;">` +
            imageResources.map(resource =>
              '<div class="image-item" style="width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 8px; border: 1px solid var(--sepia-border); cursor: pointer;" onclick="openImageModal(\'' + resource.filepath + '\')">' +
                '<img src="' + resource.filepath + '" alt="' + resource.filename + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">' +
              '</div>'
            ).join('') +
          '</div>' : '';

        const otherResourcesHTML = otherResources.length > 0 ?
          '<div class="memo-resources" style="margin-top: 16px;">' +
            otherResources.map(resource =>
              '<a href="' + resource.filepath + '" class="memo-resource" target="_blank" style="display: inline-block; margin-right: 12px; margin-bottom: 8px; padding: 6px 12px; border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text);">' +
                '📎 ' + resource.filename +
              '</a>'
            ).join('') +
          '</div>' : '';

        const tagsHTML = memo.tagList && memo.tagList.length > 0 ?
          memo.tagList.map(tag =>
            '<a href="/tag/' + encodeURIComponent(tag.name) + '" style="display: inline-block; margin-left: 2px; padding: 2px 2px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 2px; font-size: 12px; text-decoration: none; color:#C0C0C0;">#' + tag.name + '</a>'
          ).join('') : '';

        memoListHTML += `
<div class="item">
    <div class="time-box">
        <div class="dot"></div>
        <div class="time" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <img src="${avatarUrl}" alt="头像" style="width: 30px; height: 30px; border-radius: 100%; border: 2px solid #fff; box-shadow: var(--shadows);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <a href="/user/${memo.creatorId}" style="display: flex; align-items: center; gap: 8px; text-decoration: none;"><span style="color: var(--foreground-color); font-weight: 500; font-size: 14px;">${memo.creatorName || memo.creatorUsername || '匿名'}</span>
                    </a>
                </div>
            <span style="color: var(--secondary-color);">·</span>
            <a href="/m/${memo.id}" class="time" style="color: var(--highlight-color);">${dateStr}</a>
            ${memo.pinned ? '<span style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-left: 4px;">置顶</span>' : ''}
            ${tagsHTML}
        </div>
    </div>
    <div class="memo-box">
        <div class="memo-content markdown-content" id="memo-${memo.id}">${memo.content}</div>
        ${imagesHTML}
        ${otherResourcesHTML}
    </div>
</div>`;
      }

      memoListHTML += '</div>';

      if (hasMore) {
        memoListHTML += `
<div class="pages-container">
    <button id="loadMoreBtn" class="btn-outline" onclick="loadMoreMemos()">
        加载更多
    </button>
</div>
<div id="loadingIndicator" style="display: none; text-align: center; color: var(--secondary-color); margin-top: 16px;">
    加载中...
</div>`;
      }
    } else {
      memoListHTML = `
<div class="empty-state">
    <h3>暂无备忘录</h3>
    <p>广场上还很空，快来创建第一条备忘录吧</p>
</div>`;
    }

    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav('/explore')}
    </div>

    <div class="main-container">
        <div style="margin-bottom: 20px; padding: 16px; background: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows); border: 1px solid var(--border-color);">
            <h2 style="margin: 0 0 8px 0; color: var(--highlight-color); font-size: 20px;">🌍 广场</h2>
            <p style="margin: 0; color: var(--secondary-color); font-size: 14px;">发现来自所有人的公开备忘录</p>
        </div>

        ${memoListHTML}
    </div>

    <!-- Heatmap Sidebar -->
    <div class="heatmap-container">
        <h3 class="heatmap-title">📊 最近30天动态</h3>
        <div id="heatmapGrid" class="heatmap-grid"></div>
        <div class="heatmap-legend">
            <div class="heatmap-legend-item" style="background: #ebedf0;"></div>
            <div class="heatmap-legend-item" style="background: #c6e48b;"></div>
            <div class="heatmap-legend-item" style="background: #7bc96f;"></div>
            <div class="heatmap-legend-item" style="background: #239a3b;"></div>
            <div class="heatmap-legend-item" style="background: #196127;"></div>
        </div>
    </div>
</div>

<!-- Heatmap Tooltip -->
<div id="heatmapTooltip" class="heatmap-tooltip"></div>

<!-- Image Modal -->
<div id="imageModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); backdrop-filter: blur(20px);" onclick="closeImageModal()">
    <span style="position: absolute; top: 20px; right: 40px; color: #fff; font-size: 40px; font-weight: bold; cursor: pointer; z-index: 1001;" onclick="closeImageModal()">&times;</span>
    <img id="modalImage" style="margin: auto; display: block; max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
</div>

${generateFooter()}
`;

    const scripts = generateAuthScript() + `
<!-- Marked.js - Markdown 解析库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script>
<!-- Highlight.js - 代码高亮库 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<script>
    // 配置 marked 使用 highlight.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('Highlight error:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });
    }

    // 为代码块添加复制按钮
    function addCopyButtonToCodeBlocks() {
        document.querySelectorAll('pre code').forEach((codeBlock) => {
            // 检查是否已经添加了复制按钮
            if (codeBlock.parentElement.querySelector('.copy-code-btn')) {
                return;
            }

            const pre = codeBlock.parentElement;
            const button = document.createElement('button');
            button.className = 'copy-code-btn';
            button.textContent = '📋 复制';
            button.style.cssText = 'position: absolute; top: 8px; right: 8px; padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px; transition: all 0.2s;';

            button.onmouseover = () => {
                button.style.background = 'rgba(255,255,255,0.2)';
            };
            button.onmouseout = () => {
                button.style.background = 'rgba(255,255,255,0.1)';
            };

            button.onclick = async () => {
                const code = codeBlock.textContent;
                try {
                    await navigator.clipboard.writeText(code);
                    button.textContent = '✓ 已复制';
                    button.style.background = '#28a745';
                    setTimeout(() => {
                        button.textContent = '📋 复制';
                        button.style.background = 'rgba(255,255,255,0.1)';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    button.textContent = '✗ 失败';
                    setTimeout(() => {
                        button.textContent = '📋 复制';
                    }, 2000);
                }
            };

            pre.style.position = 'relative';
            pre.appendChild(button);
        });
    }

    // 页面脚本
    let currentOffset = 20;

    // 加载热力图数据
    async function loadHeatmap() {
        try {
            const response = await fetch('/api/v1/memo/stats/heatmap');
            if (!response.ok) {
                console.error('Failed to load heatmap data');
                return;
            }

            const heatmapData = await response.json();
            renderHeatmap(heatmapData);
        } catch (error) {
            console.error('Error loading heatmap:', error);
        }
    }

    // 渲染热力图
    function renderHeatmap(data) {
        const grid = document.getElementById('heatmapGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const today = new Date();
        const dates = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date);
        }

        const counts = Object.values(data);
        const maxCount = Math.max(...counts, 1);

        dates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const count = data[dateStr] || 0;

            let level = 0;
            if (count > 0) {
                level = Math.min(4, Math.ceil((count / maxCount) * 4));
            }

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.setAttribute('data-level', level);
            cell.setAttribute('data-date', dateStr);
            cell.setAttribute('data-count', count);

            cell.addEventListener('mouseenter', function(e) {
                const tooltip = document.getElementById('heatmapTooltip');
                const date = this.getAttribute('data-date');
                const count = this.getAttribute('data-count');

                tooltip.textContent = \`\${date}: \${count} 条备忘录\`;
                tooltip.style.display = 'block';

                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) + 'px';
                tooltip.style.top = (rect.top - 35) + 'px';
                tooltip.style.transform = 'translateX(-50%)';
            });

            cell.addEventListener('mouseleave', function() {
                const tooltip = document.getElementById('heatmapTooltip');
                tooltip.style.display = 'none';
            });

            grid.appendChild(cell);
        });
    }

    // 渲染Markdown
    function renderMarkdown() {
        if (typeof marked === 'undefined') return;

        document.querySelectorAll('.markdown-content').forEach(el => {
            const content = el.textContent;
            el.innerHTML = marked.parse(content);
            processMarkdownImages(el);
        });

        // 为所有代码块添加复制按钮
        addCopyButtonToCodeBlocks();
    }

    function processMarkdownImages(container) {
        const images = Array.from(container.querySelectorAll('img'));
        if (images.length === 0) return;

        // 处理markdown中的图片 - 添加样式和点击事件
        images.forEach(img => {
            // 添加样式
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '8px';
            img.style.cursor = 'pointer';
            img.style.marginTop = '8px';

            // 添加点击放大功能
            const imgSrc = img.src;
            img.onclick = () => openImageModal(imgSrc);
        });
    }

    function openImageModal(imageSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modalImg.src = imageSrc;
        document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });

    // 加载更多备忘录
    async function loadMoreMemos() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const itemsContainer = document.querySelector('.items');

        if (!itemsContainer) return;

        loadMoreBtn.style.display = 'none';
        loadingIndicator.style.display = 'block';

        try {
            const response = await fetch(\`/api/v1/memo?limit=20&offset=\${currentOffset}\`);
            if (!response.ok) {
                throw new Error('Failed to load memos');
            }

            const memos = await response.json();

            if (!Array.isArray(memos) || memos.length === 0) {
                loadMoreBtn.style.display = 'none';
                loadingIndicator.textContent = '没有更多内容了';
                loadingIndicator.style.display = 'block';
                return;
            }

            const existingMemoIds = new Set();
            document.querySelectorAll('.memo-content').forEach(el => {
                const id = el.id.replace('memo-', '');
                if (id) existingMemoIds.add(parseInt(id));
            });

            for (const memo of memos) {
                if (existingMemoIds.has(memo.id)) continue;

                const avatarHash = memo.creatorEmailHash || 'default';
                const avatarUrl = \`https://gravatar.loli.net/avatar/\${avatarHash}?s=40&d=identicon\`;
                const date = new Date(memo.createdTs * 1000);
                const dateStr = date.toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'});

                const escapeHtml = (text) => {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                };

                const escapedContent = escapeHtml(memo.content || '');

                const imageResources = memo.resourceList ? memo.resourceList.filter(r => r.type && r.type.startsWith('image/')) : [];
                const otherResources = memo.resourceList ? memo.resourceList.filter(r => !r.type || !r.type.startsWith('image/')) : [];

                const imageCount = imageResources.length;
                let gridColumns = 3;
                if (imageCount === 1) {
                    gridColumns = 1;
                } else if (imageCount === 2) {
                    gridColumns = 2;
                } else if (imageCount === 4) {
                    gridColumns = 2;
                }

                let imagesHTML = '';
                if (imageResources.length > 0) {
                    imagesHTML = \`<div class="image-grid" style="display: grid; grid-template-columns: repeat(\${gridColumns}, 1fr); max-width: 100%; gap: 10px; margin-top: 16px;">\`;
                    imageResources.forEach(resource => {
                        const imgUrl = resource.externalLink || \`/api/v1/resource/\${resource.id}/file\`;
                        imagesHTML += \`<div class="image-item" style="width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 8px; border: 1px solid var(--sepia-border); cursor: pointer;" onclick="openImageModal('\${imgUrl}')">
                            <img src="\${imgUrl}" alt="\${resource.filename}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                        </div>\`;
                    });
                    imagesHTML += '</div>';
                }

                let otherResourcesHTML = '';
                if (otherResources.length > 0) {
                    otherResourcesHTML = '<div class="memo-resources" style="margin-top: 16px;">';
                    otherResources.forEach(resource => {
                        const fileUrl = resource.externalLink || \`/api/v1/resource/\${resource.id}/file\`;
                        otherResourcesHTML += \`<a href="\${fileUrl}" class="memo-resource" target="_blank" style="display: inline-block; margin-right: 12px; margin-bottom: 8px; padding: 6px 12px; border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text);">📎 \${resource.filename}</a>\`;
                    });
                    otherResourcesHTML += '</div>';
                }

                let tagsHTML = '';
                if (memo.tagList && memo.tagList.length > 0) {
                    tagsHTML = memo.tagList.map(tag =>
                        \`<a href="/tag/\${encodeURIComponent(tag.name)}" style="display: inline-block; margin-left: 2px; padding: 2px 2px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 2px; font-size: 12px; text-decoration: none; color:#C0C0C0;">#\${tag.name}</a>\`
                    ).join('');
                }

                const memoHTML = \`
<div class="item">
    <div class="time-box">
        <div class="dot"></div>
        <div class="time" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <img src="\${avatarUrl}" alt="头像" style="width: 30px; height: 30px; border-radius: 100%; border: 2px solid #fff; box-shadow: var(--shadows);">
                <a href="/user/\${memo.creatorId}" style="display: flex; align-items: center; gap: 8px; text-decoration: none;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: var(--foreground-color); font-weight: 500; font-size: 14px;">\${memo.creatorName || memo.creatorUsername || '匿名'}</span>
                </div>
            </a>
            <span style="color: var(--secondary-color);">·</span>
            <a href="/m/\${memo.id}" class="time" style="color: var(--highlight-color);">\${dateStr}</a>
            \${memo.pinned ? '<span style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-left: 4px;">置顶</span>' : ''}
            \${tagsHTML}
        </div>
    </div>
    <div class="memo-box">
        <div class="memo-content markdown-content" id="memo-\${memo.id}" data-raw-content=""></div>
        \${imagesHTML}
        \${otherResourcesHTML}
    </div>
</div>\`;
                itemsContainer.insertAdjacentHTML('beforeend', memoHTML);

                const newMemoEl = document.getElementById(\`memo-\${memo.id}\`);
                if (newMemoEl) {
                    newMemoEl.textContent = memo.content || '';

                    if (typeof marked !== 'undefined') {
                        try {
                            const content = newMemoEl.textContent;
                            const parsed = marked.parse(content);
                            newMemoEl.innerHTML = parsed;
                            processMarkdownImages(newMemoEl);
                        } catch (error) {
                            console.error('Error rendering markdown for memo', memo.id, error);
                        }
                    }
                }
            }

            currentOffset += memos.length;

            if (memos.length < 20) {
                loadMoreBtn.style.display = 'none';
                loadingIndicator.textContent = '没有更多内容了';
                loadingIndicator.style.display = 'block';
            } else {
                loadMoreBtn.style.display = 'inline-block';
                loadingIndicator.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading more memos:', error);
            loadingIndicator.textContent = '加载失败，请重试';
            loadingIndicator.style.display = 'block';
            setTimeout(() => {
                loadMoreBtn.style.display = 'inline-block';
                loadingIndicator.style.display = 'none';
            }, 3000);
        }
    }

    window.loadMoreMemos = loadMoreMemos;

    // 初始加载广场的 memos
    async function loadExploreMemos() {
        try {
            // 获取公开的 memos
            const response = await fetch('/api/v1/memo?limit=20&offset=0');
            if (!response.ok) {
                console.error('Failed to load explore memos');
                return;
            }

            const memos = await response.json();

            // 清空现有列表
            const itemsContainer = document.querySelector('.items');
            if (!itemsContainer) return;

            itemsContainer.innerHTML = '';

            // 如果没有 memos，显示提示
            if (!memos || memos.length === 0) {
                itemsContainer.innerHTML = '<div class="empty-state"><p>广场上还很空</p></div>';
                return;
            }

            // 渲染 memos
            for (const memo of memos) {
                const avatarHash = memo.creatorEmailHash || 'default';
                const avatarUrl = \`https://gravatar.loli.net/avatar/\${avatarHash}?s=40&d=identicon\`;
                const date = new Date(memo.createdTs * 1000);
                const dateStr = date.toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'});

                const imageResources = memo.resourceList ? memo.resourceList.filter(r => r.type && r.type.startsWith('image/')) : [];
                const otherResources = memo.resourceList ? memo.resourceList.filter(r => !r.type || !r.type.startsWith('image/')) : [];

                const imageCount = imageResources.length;
                let gridColumns = 3;
                if (imageCount === 1) {
                    gridColumns = 1;
                } else if (imageCount === 2) {
                    gridColumns = 2;
                } else if (imageCount === 4) {
                    gridColumns = 2;
                }

                let imagesHTML = '';
                if (imageResources.length > 0) {
                    imagesHTML = \`<div class="image-grid" style="display: grid; grid-template-columns: repeat(\${gridColumns}, 1fr); max-width: 100%; gap: 10px; margin-top: 16px;">\`;
                    imageResources.forEach(resource => {
                        const imgUrl = resource.externalLink || \`/api/v1/resource/\${resource.id}/file\`;
                        imagesHTML += \`<div class="image-item" style="width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 8px; border: 1px solid var(--sepia-border); cursor: pointer;" onclick="openImageModal('\${imgUrl}')">
                            <img src="\${imgUrl}" alt="\${resource.filename}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                        </div>\`;
                    });
                    imagesHTML += '</div>';
                }

                let otherResourcesHTML = '';
                if (otherResources.length > 0) {
                    otherResourcesHTML = '<div class="memo-resources" style="margin-top: 16px;">';
                    otherResources.forEach(resource => {
                        const fileUrl = resource.externalLink || \`/api/v1/resource/\${resource.id}/file\`;
                        otherResourcesHTML += \`<a href="\${fileUrl}" class="memo-resource" target="_blank" style="display: inline-block; margin-right: 12px; margin-bottom: 8px; padding: 6px 12px; border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text);">📎 \${resource.filename}</a>\`;
                    });
                    otherResourcesHTML += '</div>';
                }

                let tagsHTML = '';
                if (memo.tagList && memo.tagList.length > 0) {
                    tagsHTML = memo.tagList.map(tag =>
                        \`<a href="/tag/\${encodeURIComponent(tag.name)}" style="display: inline-block; margin-left: 2px; padding: 2px 2px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 2px; font-size: 12px; text-decoration: none; color:#C0C0C0;">#\${tag.name}</a>\`
                    ).join('');
                }

                const memoHTML = \`
<div class="item">
    <div class="time-box">
        <div class="dot"></div>
        <div class="time" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <img src="\${avatarUrl}" alt="头像" style="width: 30px; height: 30px; border-radius: 100%; border: 2px solid #fff; box-shadow: var(--shadows);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <a href="/user/\${memo.creatorId}" style="display: flex; align-items: center; gap: 8px; text-decoration: none;"><span style="color: var(--foreground-color); font-weight: 500; font-size: 14px;">\${memo.creatorName || memo.creatorUsername || '匿名'}</span>
                    </a>
                </div>
            <span style="color: var(--secondary-color);">·</span>
            <a href="/m/\${memo.id}" class="time" style="color: var(--highlight-color);">\${dateStr}</a>
            \${memo.pinned ? '<span style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-left: 4px;">置顶</span>' : ''}
            \${tagsHTML}
        </div>
    </div>
    <div class="memo-box">
        <div class="memo-content markdown-content" id="memo-\${memo.id}" data-raw-content=""></div>
        \${imagesHTML}
        \${otherResourcesHTML}
    </div>
</div>\`;
                itemsContainer.insertAdjacentHTML('beforeend', memoHTML);

                // 使用 textContent 设置内容（自动转义 HTML）
                const newMemoEl = document.getElementById(\`memo-\${memo.id}\`);
                if (newMemoEl) {
                    newMemoEl.textContent = memo.content || '';

                    if (typeof marked !== 'undefined') {
                        try {
                            const content = newMemoEl.textContent;
                            const parsed = marked.parse(content);
                            newMemoEl.innerHTML = parsed;
                            processMarkdownImages(newMemoEl);
                        } catch (error) {
                            console.error('Error rendering markdown for memo', memo.id, error);
                        }
                    }
                }
            }

            // 为所有代码块添加复制按钮
            addCopyButtonToCodeBlocks();
        } catch (error) {
            console.error('Error loading explore memos:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', async function() {
        await checkLoginStatus();
        await loadExploreMemos();
        loadHeatmap();
    });
</script>
`;

    return generatePage({
      title: '广场',
      bodyContent,
      scripts,
      siteTitle: siteSettings.site_title
    });

  } catch (error) {
    console.error('Error generating explore page:', error);
    return generatePage({
      title: '错误',
      bodyContent: `
<div class="container">
    <div class="empty-state">
        <h3>页面加载失败</h3>
        <p>${error.message}</p>
    </div>
</div>
${generateFooter()}
`,
      scripts: ''
    });
  }
}
