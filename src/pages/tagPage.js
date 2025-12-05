import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript } from './pageTemplate.js';
import { getGravatarUrl } from '../utils/gravatar.js';

/**
 * 生成标签页 HTML
 */
export async function getTagPageHTML(request, env, tagName) {
  try {
    const db = env.DB;
    const decodedTagName = decodeURIComponent(tagName);

    // 验证标签是否存在
    const tagStmt = db.prepare('SELECT id, name FROM tags WHERE name = ?');
    const tag = await tagStmt.bind(decodedTagName).first();

    if (!tag) {
      throw new Error('Tag not found');
    }

    // 获取该标签下的memos
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
      JOIN memo_tags mt ON m.id = mt.memo_id
      WHERE mt.tag_id = ? AND m.row_status = 'NORMAL' AND m.visibility = 'PUBLIC'
      ORDER BY m.pinned DESC, m.display_ts DESC
    `);

    const { results: memos } = await memosStmt.bind(tag.id).all();

    // 获取每个memo的资源和标签
    for (let memo of memos) {
      // 获取资源列表
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

      // 获取标签列表
      const tagStmt2 = db.prepare(`
        SELECT t.id, t.name
        FROM tags t
        JOIN memo_tags mt ON t.id = mt.tag_id
        WHERE mt.memo_id = ?
      `);
      const { results: tags } = await tagStmt2.bind(memo.id).all();
      memo.tagList = tags || [];

      memo.pinned = Boolean(memo.pinned);
    }

    // 生成memo列表HTML
    let memoListHTML = '';
    if (Array.isArray(memos) && memos.length > 0) {
      memoListHTML = '<div class="items">';

      for (const memo of memos) {
        const avatarUrl = getGravatarUrl(memo.creatorEmail, 40, env);
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
          memo.tagList.map(t =>
            '<a href="/tag/' + encodeURIComponent(t.name) + '" style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 12px; font-size: 12px; text-decoration: none; color: var(--sepia-accent);">#' + t.name + '</a>'
          ).join('') : '';

        memoListHTML += `
<div class="item">
    <div class="time-box">
        <div class="dot"></div>
        <div class="time" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <a href="/user/${memo.creatorId}" style="display: flex; align-items: center; gap: 8px; text-decoration: none;">
                <img src="${avatarUrl}" alt="头像" style="width: 30px; height: 30px; border-radius: 100%; border: 2px solid #fff; box-shadow: var(--shadows);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: var(--foreground-color); font-weight: 500; font-size: 14px;">${memo.creatorName || memo.creatorUsername || '匿名'}</span>
                    <span style="color: var(--secondary-color); font-size: 13px;">@${memo.creatorUsername}</span>
                </div>
            </a>
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
    } else {
      memoListHTML = `
<div class="empty-state">
    <h3>暂无相关备忘录</h3>
    <p>还没有带有 #${decodedTagName} 标签的备忘录</p>
</div>`;
    }

    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader()}
        ${generateNav()}
    </div>

    <div class="main-container">
        <!-- Tag Header -->
        <div style="padding: 20px; margin-bottom: 24px; background: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows); border: 1px solid var(--border-color);">
            <div style="font-size: 28px; font-weight: 600; color: var(--foreground-color); margin-bottom: 8px;">
                #${decodedTagName}
            </div>
            <div style="color: var(--secondary-color); font-size: 14px;">
                共 ${memos.length} 条备忘录
            </div>
        </div>

        <!-- Breadcrumb -->
        <div style="padding: 10px 0; margin-bottom: 24px; display: flex; align-items: center; font-size: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
            <a href="/" style="color: var(--secondary-color); text-decoration: none;">← 返回首页</a>
        </div>

        ${memoListHTML}
    </div>
</div>

<!-- Image Modal -->
<div id="imageModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); backdrop-filter: blur(20px);" onclick="closeImageModal()">
    <span style="position: absolute; top: 20px; right: 40px; color: #fff; font-size: 40px; font-weight: bold; cursor: pointer; z-index: 1001;" onclick="closeImageModal()">&times;</span>
    <img id="modalImage" style="margin: auto; display: block; max-width: 90%; max-height: 90%; width: auto; height: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
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

    function renderMarkdown() {
        if (typeof marked === 'undefined') return;

        document.querySelectorAll('.markdown-content').forEach(el => {
            const content = el.textContent;
            el.innerHTML = marked.parse(content);
            processMarkdownImages(el);
        });
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

    document.addEventListener('DOMContentLoaded', function() {
        renderMarkdown();
    });
</script>
`;

    return generatePage({
      title: `#${decodedTagName}`,
      bodyContent,
      scripts
    });

  } catch (error) {
    console.error('Error generating tag page:', error);
    return generatePage({
      title: '错误',
      bodyContent: `
<div class="container">
    <div class="empty-state">
        <h3>标签不存在</h3>
        <p>${error.message}</p>
        <a href="/" class="btn" style="display: inline-block; margin-top: 16px;">返回首页</a>
    </div>
</div>
${generateFooter()}
`,
      scripts: ''
    });
  }
}
