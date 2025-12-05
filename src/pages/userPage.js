import { getGravatarUrl } from '../utils/gravatar.js';
import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript } from './pageTemplate.js';

export async function getUserPageHTML(request, env, userId) {
  try {
    const db = env.DB;

    // 获取用户信息
    const userStmt = db.prepare(`
      SELECT id, username, nickname, email, created_ts, is_admin
      FROM users
      WHERE id = ?
    `);
    const user = await userStmt.bind(userId).first();

    if (!user) {
      return generatePage({
        title: '用户未找到',
        bodyContent: `
<div class="container">
    <div class="aside-container">
        ${generateHeader()}
        ${generateNav()}
    </div>
    <div class="main-container">
        <div class="empty-state">
            <h1 style="color: var(--highlight-color); margin-bottom: 16px;">用户未找到</h1>
            <p style="color: var(--secondary-color); margin-bottom: 24px;">找不到指定的用户</p>
            <a href="/" class="btn">返回首页</a>
        </div>
    </div>
</div>
${generateFooter()}
        `
      });
    }

    // 获取用户的memo列表
    const memosStmt = db.prepare(`
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
      WHERE m.creator_id = ? AND m.row_status = 'NORMAL' AND m.visibility = 'PUBLIC'
      ORDER BY m.pinned DESC, m.display_ts DESC
    `);

    const { results: memos } = await memosStmt.bind(userId).all();

    // 处理memo数据，获取资源列表
    for (let memo of memos) {
      const resourceStmt = db.prepare(`
        SELECT r.id, r.filename, r.filepath, r.type, r.size
        FROM resources r
        JOIN memo_resources mr ON r.id = mr.resource_id
        WHERE mr.memo_id = ?
      `);
      const { results: resources } = await resourceStmt.bind(memo.id).all();

      // 转换资源路径为代理路径
      memo.resourceList = (resources || []).map(r => ({
        ...r,
        filepath: r.filepath.startsWith('http') || r.filepath.startsWith('/api/')
          ? r.filepath
          : `/api/v1/resource/${r.id}/file`
      }));
      memo.relationList = [];
      memo.pinned = Boolean(memo.pinned);
    }

    const avatarUrl = getGravatarUrl(user.email, 80, env);

    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader()}
        ${generateNav()}
    </div>

    <div class="main-container">
        <!-- Header with User Info -->
        <div style="padding: 20px; margin-bottom: 24px; display: flex; align-items: center; background: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows);">
            <img src="${avatarUrl}" alt="${user.nickname}" style="width: 60px; height: 60px; border-radius: 100%; border: 3px solid #fff; box-shadow: var(--shadows); display: block;">
            <div style="flex: 1; margin-left: 16px; padding-right: 16px;">
                <div style="font-size: 24px; font-weight: 600; color: var(--foreground-color);">
                    ${user.nickname}
                    ${user.is_admin ? '<span style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.65rem; font-weight: bold; margin-left: 0.5rem;">ADMIN</span>' : ''}
                </div>
                <div style="font-size: 14px; color: var(--secondary-color); margin-top: 4px;">@${user.username}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 32px; font-weight: bold; color: var(--highlight-color); line-height: 1;">${memos.length}</div>
                <div style="font-size: 12px; color: var(--secondary-color); margin-top: 4px;">公开备忘录</div>
            </div>
        </div>

        <!-- Breadcrumb -->
        <div style="padding: 10px 0; margin-bottom: 24px; display: flex; align-items: center; font-size: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
            <a href="/" style="color: var(--secondary-color); text-decoration: none;">← 返回首页</a>
        </div>

        <!-- Memos Timeline -->
        ${Array.isArray(memos) && memos.length > 0 ? `
            <div class="items">
                ${memos.map(memo => {
                    // 分离图片和非图片资源
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

                // 图片资源 - 智能布局
                const imagesHTML = imageResources.length > 0 ?
                  `<div class="image-grid" style="display: grid; grid-template-columns: repeat(${gridColumns}, 1fr); max-width: 100%; gap: 10px; margin-top: 16px; border-left: 2px solid var(--border-color); padding-left: 30px; margin-left: 3px;">
                    ${imageResources.map(resource =>
                      `<div class="image-item" style="width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer;" onclick="openImageModal('${resource.filepath}')">
                        <img src="${resource.filepath}" alt="${resource.filename}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                      </div>`
                    ).join('')}
                  </div>` : '';

                // 其他资源
                const otherResourcesHTML = otherResources.length > 0 ?
                  `<div style="border-left: 2px solid var(--border-color); padding: 0 0 0 30px; font-size: 14px; line-height: 1.6; margin-left: 3px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 16px;">
                    <div style="width: 16px; height: 16px; opacity: 0.25; display: inline-block;">📎</div>
                    ${otherResources.map(resource =>
                      `<a href="${resource.filepath}" style="color: var(--secondary-color); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 10px; text-decoration: none; display: inline-block; background: var(--code-background-color);" target="_blank" rel="noopener noreferrer">
                        ${resource.filename}
                      </a>`
                    ).join('')}
                  </div>` : '';

                return `
                <div class="item" style="margin-bottom: 48px;">
                    <!-- Time Box -->
                    <div class="time-box">
                        <div class="dot" style="${memo.pinned ? 'background-color: var(--highlight-color);' : ''}"></div>
                        <div class="time" style="${memo.pinned ? 'color: var(--highlight-color);' : ''}">
                            <a href="/m/${memo.id}" style="color: ${memo.pinned ? 'var(--highlight-color)' : 'var(--link-color)'}; text-decoration: none;">
                                <time datetime="${new Date(memo.createdTs * 1000).toISOString()}" title="${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}">
                                    ${new Date(memo.createdTs * 1000).toLocaleString('zh-CN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        weekday: 'short'
                                    })}
                                </time>
                            </a>
                        </div>
                    </div>

                    <!-- Content Box -->
                    <div class="memo-box">
                        ${memo.pinned ? '<div style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-bottom: 12px;">📌 置顶</div><br>' : ''}
                        <p style="margin: 0;" class="memo-text markdown-content">${memo.content}</p>
                    </div>

                    ${imagesHTML}
                    ${otherResourcesHTML}
                </div>`;
            }).join('')}
        </div>
    ` : `
        <div class="empty-state" style="margin-top: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📝</div>
            <h3 style="color: var(--foreground-color); margin-bottom: 12px;">暂无公开备忘录</h3>
            <p style="color: var(--secondary-color);">${user.nickname} 还没有创建任何公开备忘录</p>
        </div>
    `}
    </div>
</div>

<!-- Image Modal -->
<div id="imageModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); backdrop-filter: blur(20px);" onclick="closeImageModal()">
    <span style="position: absolute; top: 20px; right: 40px; color: #fff; font-size: 40px; font-weight: bold; cursor: pointer; z-index: 1001;" onclick="closeImageModal()">&times;</span>
    <img id="modalImage" style="margin: auto; display: block; max-width: 90%; max-height: 90%; width: auto; height: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
</div>

${generateFooter()}
`;

    return generatePage({
      title: `${user.nickname} 的备忘录`,
      bodyContent,
      scripts: generateAuthScript() + `
<!-- Marked.js - Markdown 解析库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script>

<script>
    // 配置 marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }

    // 渲染 Markdown
    function renderMarkdown() {
        if (typeof marked === 'undefined') return;

        document.querySelectorAll('.memo-text').forEach(el => {
            const content = el.textContent;
            const parent = el.closest('.markdown-content');
            if (parent) {
                // 保留 pinned 标签
                const pinnedBadge = parent.querySelector('div[style*="PINNED"]');
                parent.innerHTML = (pinnedBadge ? pinnedBadge.outerHTML + '<br>' : '') + marked.parse(content);

                // 处理图片 - 转换为9宫格
                processMarkdownImages(parent);
            }
        });
    }

    // 处理 Markdown 中的图片
    function processMarkdownImages(container) {
        const images = Array.from(container.querySelectorAll('img'));
        if (images.length === 0) return;

        // 获取页面上九宫格中显示的图片URL（来自resourceList）
        const resourceUrls = new Set();
        const memoItem = container.closest('.memo-item');

        if (memoItem) {
            const gridImages = memoItem.querySelectorAll('.image-grid img');
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
                img.style.marginTop = '8px';

                // 添加点击放大功能
                const imgSrc = img.src;
                img.onclick = () => openImageModal(imgSrc);
            }
        });
    }

    // 图片模态框函数
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

    // ESC 键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });

    // 页面加载完成后渲染 Markdown
    window.addEventListener('DOMContentLoaded', renderMarkdown);
</script>
      `
    });
  } catch (error) {
    console.error('Error generating user page HTML:', error);
    return generatePage({
      title: '错误',
      bodyContent: `
<div class="container">
    <div class="aside-container">
        ${generateHeader()}
        ${generateNav()}
    </div>
    <div class="main-container">
        <div class="empty-state">
            <h1 style="color: var(--highlight-color); margin-bottom: 16px;">加载失败</h1>
            <p style="color: var(--secondary-color); margin-bottom: 24px;">无法加载用户页面: ${error.message}</p>
            <a href="/" class="btn">返回首页</a>
        </div>
    </div>
</div>
${generateFooter()}
      `
    });
  }
}
