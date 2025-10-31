import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript } from './pageTemplate.js';

/**
 * 生成搜索页 HTML
 */
export function getSearchPageHTML() {
  const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader()}
        ${generateNav()}
    </div>

    <div class="main-container">
        <!-- Search Header -->
        <div style="padding: 20px; margin-bottom: 24px; background: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows); border: 1px solid var(--border-color);">
            <h1 style="color: var(--foreground-color); font-size: 24px; margin-bottom: 16px;">🔍 搜索备忘录</h1>

            <div style="display: flex; gap: 12px; align-items: center;">
                <input
                    type="text"
                    id="searchInput"
                    placeholder="搜索内容、标签或用户..."
                    class="form-input"
                    style="flex: 1;"
                    autofocus
                />
                <button onclick="performSearch()" class="btn" style="padding: 0.6rem 1.5rem;">搜索</button>
            </div>

            <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 6px; color: var(--secondary-color); font-size: 14px;">
                    <input type="checkbox" id="searchContent" checked style="cursor: pointer;">
                    <span>内容</span>
                </label>
                <label style="display: flex; align-items: center; gap: 6px; color: var(--secondary-color); font-size: 14px;">
                    <input type="checkbox" id="searchTags" checked style="cursor: pointer;">
                    <span>标签</span>
                </label>
                <label style="display: flex; align-items: center; gap: 6px; color: var(--secondary-color); font-size: 14px;">
                    <input type="checkbox" id="searchUsername" style="cursor: pointer;">
                    <span>用户名</span>
                </label>
            </div>
        </div>

        <!-- Search Results -->
        <div id="searchResults"></div>

        <!-- Loading Indicator -->
        <div id="loadingIndicator" style="display: none; text-align: center; padding: 40px; color: var(--secondary-color);">
            <div style="font-size: 18px;">搜索中...</div>
        </div>
    </div>
</div>

${generateFooter()}
`;

    const scripts = generateAuthScript() + `
<!-- Marked.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script>

<script>
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }

    // 从URL参数获取搜索关键词
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery) {
        document.getElementById('searchInput').value = initialQuery;
        performSearch();
    }

    // 回车触发搜索
    document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            document.getElementById('searchResults').innerHTML = \`
                <div class="empty-state">
                    <h3>请输入搜索关键词</h3>
                    <p>搜索内容、标签或用户名</p>
                </div>
            \`;
            return;
        }

        const searchContent = document.getElementById('searchContent').checked;
        const searchTags = document.getElementById('searchTags').checked;
        const searchUsername = document.getElementById('searchUsername').checked;

        // 更新URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('q', query);
        window.history.pushState({}, '', newUrl);

        const resultsContainer = document.getElementById('searchResults');
        const loadingIndicator = document.getElementById('loadingIndicator');

        resultsContainer.innerHTML = '';
        loadingIndicator.style.display = 'block';

        try {
            // 构建搜索参数
            const params = new URLSearchParams({
                q: query,
                content: searchContent,
                tags: searchTags,
                username: searchUsername
            });

            const response = await fetch(\`/api/v1/memo/search?\${params}\`);
            if (!response.ok) {
                throw new Error('搜索失败');
            }

            const memos = await response.json();
            loadingIndicator.style.display = 'none';

            if (!memos || memos.length === 0) {
                resultsContainer.innerHTML = \`
                    <div class="empty-state">
                        <h3>未找到结果</h3>
                        <p>没有找到与 "\${query}" 相关的备忘录</p>
                    </div>
                \`;
                return;
            }

            // 显示结果数量
            resultsContainer.innerHTML = \`
                <div style="padding: 12px 0; margin-bottom: 16px; color: var(--secondary-color); font-size: 14px;">
                    找到 \${memos.length} 条结果
                </div>
                <div class="items" id="memoItems"></div>
            \`;

            const memoItems = document.getElementById('memoItems');

            // 渲染每个memo
            for (const memo of memos) {
                const avatarHash = memo.creatorEmail ? md5(memo.creatorEmail.trim().toLowerCase()) : 'default';
                const avatarUrl = \`https://gravatar.loli.net/avatar/\${avatarHash}?s=40&d=identicon\`;
                const date = new Date(memo.createdTs * 1000);
                const dateStr = date.toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'});

                const imageResources = memo.resourceList ? memo.resourceList.filter(r => r.type && r.type.startsWith('image/')) : [];
                const otherResources = memo.resourceList ? memo.resourceList.filter(r => !r.type || !r.type.startsWith('image/')) : [];

                // 根据图片数量决定列数：1张=1列，2张=2列，3张=3列，4张=2列，5+张=3列
                const imageCount = imageResources.length;
                let gridColumns = 3; // 默认3列
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
                        imagesHTML += \`<div class="image-item" style="width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 8px; border: 1px solid var(--sepia-border); cursor: pointer;" onclick="openImageModal('\${resource.filepath}')">
                            <img src="\${resource.filepath}" alt="\${resource.filename}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                        </div>\`;
                    });
                    imagesHTML += '</div>';
                }

                let otherResourcesHTML = '';
                if (otherResources.length > 0) {
                    otherResourcesHTML = '<div class="memo-resources" style="margin-top: 16px;">';
                    otherResources.forEach(resource => {
                        otherResourcesHTML += \`<a href="\${resource.filepath}" class="memo-resource" target="_blank" style="display: inline-block; margin-right: 12px; margin-bottom: 8px; padding: 6px 12px; border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text);">📎 \${resource.filename}</a>\`;
                    });
                    otherResourcesHTML += '</div>';
                }

                let tagsHTML = '';
                if (memo.tagList && memo.tagList.length > 0) {
                    tagsHTML = memo.tagList.map(tag =>
                        \`<a href="/tag/\${encodeURIComponent(tag.name)}" style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 12px; font-size: 12px; text-decoration: none; color: var(--sepia-accent);">#\${tag.name}</a>\`
                    ).join('');
                }

                const memoHTML = \`
<div class="item">
    <div class="time-box">
        <div class="dot"></div>
        <div class="time" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <a href="/user/\${memo.creatorId}" style="display: flex; align-items: center; gap: 8px; text-decoration: none;">
                <img src="\${avatarUrl}" alt="头像" style="width: 30px; height: 30px; border-radius: 100%; border: 2px solid #fff; box-shadow: var(--shadows);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: var(--foreground-color); font-weight: 500; font-size: 14px;">\${memo.creatorName || memo.creatorUsername || '匿名'}</span>
                    <span style="color: var(--secondary-color); font-size: 13px;">@\${memo.creatorUsername}</span>
                </div>
            </a>
            <span style="color: var(--secondary-color);">·</span>
            <a href="/m/\${memo.id}" class="time" style="color: var(--highlight-color);">\${dateStr}</a>
            \${memo.pinned ? '<span style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-left: 4px;">置顶</span>' : ''}
            \${tagsHTML}
        </div>
    </div>
    <div class="memo-box">
        <div class="memo-content markdown-content" id="memo-\${memo.id}">\${memo.content}</div>
        \${imagesHTML}
        \${otherResourcesHTML}
    </div>
</div>\`;

                memoItems.insertAdjacentHTML('beforeend', memoHTML);

                // 渲染Markdown
                const memoEl = document.getElementById(\`memo-\${memo.id}\`);
                if (memoEl && typeof marked !== 'undefined') {
                    const content = memoEl.textContent;
                    memoEl.innerHTML = marked.parse(content);
                    processMarkdownImages(memoEl);
                }
            }

        } catch (error) {
            console.error('Search error:', error);
            loadingIndicator.style.display = 'none';
            resultsContainer.innerHTML = \`
                <div class="empty-state">
                    <h3>搜索失败</h3>
                    <p>\${error.message}</p>
                </div>
            \`;
        }
    }

    // 处理 Markdown 中的图片
    function processMarkdownImages(container) {
        const images = Array.from(container.querySelectorAll('img'));
        if (images.length === 0) return;

        // 获取容器所属memo的resourceList（从九宫格中的图片URL）
        const memoBox = container.closest('.item');
        const resourceUrls = new Set();

        if (memoBox) {
            // 收集九宫格中显示的图片URL
            const gridImages = memoBox.querySelectorAll('.image-grid img');
            gridImages.forEach(img => {
                resourceUrls.add(img.src);
            });
        }

        // 处理markdown中的图片
        images.forEach(img => {
            const parent = img.parentElement;

            // 如果图片URL在resourceList中（已在九宫格显示），则移除
            if (resourceUrls.has(img.src)) {
                img.remove();
                // 如果父元素是p标签且现在为空，也移除父元素
                if (parent && parent.tagName === 'P' && parent.textContent.trim() === '') {
                    parent.remove();
                }
            } else {
                // 否则保留图片，但限制最大宽度避免超出容器
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.borderRadius = '8px';
                img.style.cursor = 'pointer';

                // 添加点击放大功能
                const imgSrc = img.src;
                img.onclick = () => openImageModal(imgSrc);
            }
        });
    }

    function openImageModal(imageSrc) {
        // 创建临时模态框
        const modal = document.createElement('div');
        modal.style.cssText = 'display: flex; align-items: center; justify-content: center; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); backdrop-filter: blur(20px);';
        modal.onclick = () => modal.remove();

        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);';

        modal.appendChild(img);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    window.performSearch = performSearch;
</script>
`;

    return generatePage({
      title: '搜索',
      bodyContent,
      scripts
    });
}
