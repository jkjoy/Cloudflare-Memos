import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';
import { getGravatarUrl } from '../utils/gravatar.js';

/**
 * 生成首页 HTML (Broadcast 风格)
 */
export async function getHomePageHTML(request, env) {
  try {
    const db = env.DB;

    // 获取网站设置
    const siteSettings = await getSiteSettings(env);

    // 获取 memos
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

    // 获取每个memo的资源列表
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

      // 获取标签列表
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

    // 生成 memo 列表 HTML（时间线风格）
    let memoListHTML = '';
    if (Array.isArray(memos) && memos.length > 0) {
      memoListHTML = '<div class="items">';

      for (const memo of memos) {
        const avatarUrl = getGravatarUrl(memo.creatorEmail, 40, env);
        const date = new Date(memo.createdTs * 1000);
        const dateStr = date.toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'});

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
          `<div class="image-grid" style="display: grid; grid-template-columns: repeat(${gridColumns}, 1fr); max-width: 100%; gap: 10px; margin-top: 16px;">` +
            imageResources.map(resource =>
              '<div class="image-item" style="width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 8px; border: 1px solid var(--sepia-border); cursor: pointer;" onclick="openImageModal(\'' + resource.filepath + '\')">' +
                '<img src="' + resource.filepath + '" alt="' + resource.filename + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">' +
              '</div>'
            ).join('') +
          '</div>' : '';

        // 其他资源列表
        const otherResourcesHTML = otherResources.length > 0 ?
          '<div class="memo-resources" style="margin-top: 16px;">' +
            otherResources.map(resource =>
              '<a href="' + resource.filepath + '" class="memo-resource" target="_blank" style="display: inline-block; margin-right: 12px; margin-bottom: 8px; padding: 6px 12px; border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text);">' +
                '📎 ' + resource.filename +
              '</a>'
            ).join('') +
          '</div>' : '';

        // 标签列表
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

      // 如果有更多内容，添加加载更多按钮
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
    <p>这里还很空，快来创建第一条备忘录吧</p>
</div>`;
    }

    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav()}
    </div>

    <div class="main-container">
        <div style="margin-bottom: 20px; padding: 16px; background: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows); border: 1px solid var(--border-color);">
            <h2 style="margin: 0 0 8px 0; color: var(--highlight-color); font-size: 20px;">🏠 我的空间</h2>
            <p style="margin: 0; color: var(--secondary-color); font-size: 14px;">在这里管理你的所有备忘录（公开 + 私密）</p>
        </div>

        <div class="form-card" id="createForm" style="display: none;">
            <h3 class="form-title">创建新备忘录</h3>
            <form id="createMemoForm">
                <div class="form-group">
                    <label class="form-label" for="content">内容 <span style="color: var(--sepia-text-muted); font-size: 0.85rem; font-weight: normal;">(支持 Markdown 语法)</span></label>

                    <!-- 工具栏 -->
                    <div style="display: flex; gap: 8px; margin-bottom: 8px; padding: 8px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px 4px 0 0;">
                        <button type="button" class="editor-btn" onclick="insertMarkdown('**', '**')" title="粗体">
                            <strong>B</strong>
                        </button>
                        <button type="button" class="editor-btn" onclick="insertMarkdown('*', '*')" title="斜体">
                            <em>I</em>
                        </button>
                        <button type="button" class="editor-btn" onclick="insertMarkdown('~~', '~~')" title="删除线">
                            <s>S</s>
                        </button>
                        <button type="button" class="editor-btn" onclick="insertMarkdown('\\n# ', '')" title="标题">
                            H
                        </button>
                        <button type="button" class="editor-btn" onclick="insertMarkdown('[', '](url)')" title="链接">
                            🔗
                        </button>
                        <button type="button" class="editor-btn" onclick="insertMarkdown('\\n- ', '')" title="列表">
                            ≡
                        </button>
                        <button type="button" class="editor-btn" onclick="insertMarkdown('\\n\`\`\`\\n', '\\n\`\`\`')" title="代码块">
                            &lt;/&gt;
                        </button>
                        <div style="flex: 1;"></div>
                        <label class="editor-btn" style="cursor: pointer; margin: 0;" title="上传文件（支持多选）">
                            📎
                            <input type="file" id="imageUpload" accept="image/*,video/*,audio/*,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md" multiple style="display: none;" onchange="uploadFiles(this)">
                        </label>
                        <button type="button" class="editor-btn" onclick="togglePreview()" title="预览">
                            👁️
                        </button>
                    </div>

                    <textarea id="content" name="content" class="form-textarea" placeholder="支持 Markdown 语法，例如：&#10;# 标题&#10;**粗体** *斜体*&#10;- 列表项&#10;[链接](url)&#10;\`代码\`" required style="border-radius: 0 0 4px 4px; min-height: 150px; font-family: var(--font-mono);"></textarea>

                    <!-- 预览区域 -->
                    <div id="preview" style="display: none; padding: 16px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px; margin-top: 8px; min-height: 150px;">
                        <div style="color: var(--sepia-text-muted); font-size: 14px; margin-bottom: 8px;">预览：</div>
                        <div id="previewContent" class="markdown-content"></div>
                    </div>

                    <!-- 文件预览区域 -->
                    <div id="imagePreviewContainer" style="display: none; margin-top: 12px; padding: 12px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px;">
                        <div style="color: var(--sepia-text-muted); font-size: 14px; margin-bottom: 8px;">已上传的文件：</div>
                        <div id="imagePreviews" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;"></div>
                    </div>
                </div>

                <!-- 可见性选择 -->
                <div class="form-group">
                    <label class="form-label" for="visibility">可见性</label>
                    <select id="visibility" name="visibility" class="form-input">
                        <option value="PUBLIC">公开 - 所有人可见</option>
                        <option value="PRIVATE">私密 - 仅自己可见</option>
                    </select>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                    <button type="submit" class="btn">发布备忘录</button>
                    <span id="uploadStatus" style="color: var(--sepia-text-muted); font-size: 14px;"></span>
                </div>
            </form>
        </div>

        <div class="empty-state" id="loginPrompt">
            <h3>请先登录</h3>
            <p>需要登录后才能创建备忘录</p>
            <a href="/login" class="btn" style="display: inline-block; margin-top: 16px;">立即登录</a>
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
    <img id="modalImage" style="margin: auto; display: block; max-width: 90%; max-height: 90%; width: auto; height: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
</div>

<!-- Message Modal -->
<div id="messageModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(61, 61, 61, 0.8);">
    <div style="background-color: var(--cell-background-color); margin: 10% auto; padding: 24px; border-radius: var(--box-border-radius); width: 90%; max-width: 400px; text-align: center; box-shadow: var(--shadows); border: 1px solid var(--border-color);">
        <div id="messageIcon" style="font-size: 48px; margin-bottom: 16px;">ℹ️</div>
        <h3 id="messageTitle" style="color: var(--foreground-color); margin-bottom: 12px;">消息</h3>
        <p id="messageText" style="color: var(--secondary-color); margin-bottom: 24px;"></p>
        <button class="btn" onclick="hideMessage()">确定</button>
    </div>
</div>

${generateFooter()}
`;

    const scripts = generateAuthScript() + `
<!-- Marked.js - Markdown 解析库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script>
<!-- MD5.js - MD5哈希库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js"></script>
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

    // 为代码块添加复制���钮
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

    // Message modal functions
    function showMessage(type, title, text, callback) {
        const modal = document.getElementById('messageModal');
        if (!modal) {
            console.error('Modal element not found');
            return;
        }

        const icon = document.getElementById('messageIcon');
        const titleEl = document.getElementById('messageTitle');
        const textEl = document.getElementById('messageText');

        icon.style.color = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : 'var(--sepia-accent)';
        icon.textContent = type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️';

        titleEl.textContent = title;
        textEl.innerHTML = text;
        modal.style.display = 'block';

        modal.callback = callback;
    }

    function hideMessage() {
        const modal = document.getElementById('messageModal');
        if (!modal) return;

        modal.style.display = 'none';

        if (modal.callback) {
            modal.callback();
            modal.callback = null;
        }
    }

    // Click outside to close message modal
    document.addEventListener('DOMContentLoaded', function() {
        const messageModal = document.getElementById('messageModal');
        if (messageModal) {
            messageModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    hideMessage();
                }
            });
        }
    });

    // Markdown 编辑器功能
    function insertMarkdown(before, after) {
        const textarea = document.getElementById('content');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const replacement = before + selectedText + after;

        textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
        textarea.focus();

        // 设置光标位置
        const newPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newPos, newPos);
    }

    // 切换预览
    function togglePreview() {
        const textarea = document.getElementById('content');
        const preview = document.getElementById('preview');
        const previewContent = document.getElementById('previewContent');

        if (preview.style.display === 'none') {
            // 显示预览
            if (typeof marked !== 'undefined') {
                previewContent.innerHTML = marked.parse(textarea.value || '*没有内容*');
            } else {
                previewContent.textContent = textarea.value || '没有内容';
            }
            preview.style.display = 'block';
        } else {
            // 隐藏预览
            preview.style.display = 'none';
        }
    }

    // 存储已上传的文件
    let uploadedImages = [];

    // 批量上传文件
    async function uploadFiles(input) {
        const files = Array.from(input.files);
        if (files.length === 0) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('请先登录');
            return;
        }

        const status = document.getElementById('uploadStatus');
        status.textContent = \`准备上传 \${files.length} 个文件...\`;
        status.style.color = 'var(--sepia-accent)';

        let successCount = 0;
        let failCount = 0;

        // 逐个上传文件
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            status.textContent = \`正在上传 (\${i + 1}/\${files.length}): \${file.name}\`;

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/v1/resource', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    // 添加到已上传文件数组
                    uploadedImages.push({
                        id: result.id,
                        filename: result.filename,
                        filepath: result.filepath,
                        type: result.type
                    });
                    successCount++;
                } else {
                    console.error(\`上传失败: \${file.name}\`, result);
                    failCount++;
                }
            } catch (error) {
                console.error(\`上传失败: \${file.name}\`, error);
                failCount++;
            }
        }

        // 显示预览
        showImagePreview();

        // 显示最终状态
        if (failCount === 0) {
            status.textContent = \`成功上传 \${successCount} 个文件！\`;
            status.style.color = '#28a745';
        } else {
            status.textContent = \`上传完成：成功 \${successCount} 个，失败 \${failCount} 个\`;
            status.style.color = '#dc3545';
        }
        setTimeout(() => { status.textContent = ''; }, 5000);

        // 重置文件输入
        input.value = '';
    }

    // 显示文件预览
    function showImagePreview() {
        const container = document.getElementById('imagePreviewContainer');
        const previews = document.getElementById('imagePreviews');

        if (uploadedImages.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        previews.innerHTML = '';

        uploadedImages.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--sepia-border); box-shadow: var(--shadows); background: var(--sepia-surface);';

            // 判断文件类型
            const isImage = file.type && file.type.startsWith('image/');
            const isVideo = file.type && file.type.startsWith('video/');
            const isAudio = file.type && file.type.startsWith('audio/');

            let previewHTML = '';
            if (isImage) {
                // 图片预览
                previewHTML = \`<img src="\${file.filepath}" alt="\${file.filename}" style="width: 100%; height: 120px; object-fit: cover; display: block;">\`;
            } else if (isVideo) {
                // 视频预览
                previewHTML = \`<div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px;">🎬</div>
                        <div style="font-size: 12px; margin-top: 4px;">\${file.filename}</div>
                    </div>
                </div>\`;
            } else if (isAudio) {
                // 音频预览
                previewHTML = \`<div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px;">🎵</div>
                        <div style="font-size: 12px; margin-top: 4px;">\${file.filename}</div>
                    </div>
                </div>\`;
            } else {
                // 其他文件类型
                const icon = getFileIcon(file.type, file.filename);
                previewHTML = \`<div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px;">\${icon}</div>
                        <div style="font-size: 11px; margin-top: 4px; padding: 0 4px; word-break: break-all;">\${file.filename}</div>
                    </div>
                </div>\`;
            }

            previewItem.innerHTML = \`
                \${previewHTML}
                <button type="button" onclick="removeImage(\${index})" style="position: absolute; top: 4px; right: 4px; background: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center;" title="删除">×</button>
            \`;

            previews.appendChild(previewItem);
        });
    }

    // 根据文件类型返回图标
    function getFileIcon(type, filename) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gzip')) return '📦';
        if (type.includes('word') || type.includes('document') || filename.endsWith('.doc') || filename.endsWith('.docx')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet') || filename.endsWith('.xls') || filename.endsWith('.xlsx')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation') || filename.endsWith('.ppt') || filename.endsWith('.pptx')) return '📊';
        if (type.includes('text') || filename.endsWith('.txt') || filename.endsWith('.md')) return '📃';
        if (type.includes('json') || type.includes('xml')) return '🗂️';
        return '📎';
    }

    // 删除文件
    function removeImage(index) {
        uploadedImages.splice(index, 1);
        showImagePreview();
    }

    // 渲染页面上的所有 Markdown 内容
    function renderMarkdown() {
        if (typeof marked === 'undefined') return;

        document.querySelectorAll('.markdown-content').forEach(el => {
            const content = el.textContent;
            el.innerHTML = marked.parse(content);

            // 处理图片 - 添加样式和点击事件
            processMarkdownImages(el);
        });

        // 为所有代码块添加复制按钮
        addCopyButtonToCodeBlocks();
    }

    // 处理 Markdown 中的图片
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

    // 页面脚本
    let currentOffset = 20; // 已加载的数量

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

        // 获取最近30天的日期
        const today = new Date();
        const dates = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date);
        }

        // 计算最大值用于分级
        const counts = Object.values(data);
        const maxCount = Math.max(...counts, 1);

        // 创建热力图单元格
        dates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const count = data[dateStr] || 0;

            // 计算等级 (0-4)
            let level = 0;
            if (count > 0) {
                level = Math.min(4, Math.ceil((count / maxCount) * 4));
            }

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.setAttribute('data-level', level);
            cell.setAttribute('data-date', dateStr);
            cell.setAttribute('data-count', count);

            // 添加hover事件显示tooltip
            cell.addEventListener('mouseenter', function(e) {
                const tooltip = document.getElementById('heatmapTooltip');
                const date = this.getAttribute('data-date');
                const count = this.getAttribute('data-count');

                tooltip.textContent = \`\${date}: \${count} 条备忘录\`;
                tooltip.style.display = 'block';

                // 定位tooltip
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

    async function init() {
        const isLoggedIn = await checkLoginStatus();
        const loginPrompt = document.getElementById('loginPrompt');
        const createForm = document.getElementById('createForm');

        if (isLoggedIn) {
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (createForm) createForm.style.display = 'block';

            // 登录后，重新加载当前用户的所有memo（包含markdown渲染）
            await loadUserMemos();
        } else {
            // 未登录时重定向到广场
            window.location.href = '/explore';
            return;
        }

        // 注意：不再调用 renderMarkdown()，因为 loadUserMemos() 已经处理了

        // 加载热力图
        loadHeatmap();
    }

    // 等待 marked 库加载
    function waitForMarked() {
        return new Promise((resolve) => {
            if (typeof marked !== 'undefined') {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (typeof marked !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
            }
        });
    }

    // 加载当前用户的所有memo
    async function loadUserMemos() {
        try {
            const token = localStorage.getItem('accessToken');
            const username = localStorage.getItem('username');

            if (!token || !username) return;

            // 获取当前用户信息
            const userResponse = await fetch('/api/v1/user', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!userResponse.ok) return;

            const users = await userResponse.json();
            const currentUser = users.find(u => u.username === username);

            if (!currentUser) return;

            // 加载该用户的所有memo（公开+私密）
            const response = await fetch(\`/api/v1/memo?creatorId=\${currentUser.id}&rowStatus=NORMAL\`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) return;

            const memos = await response.json();

            // 清空现有列表
            const itemsContainer = document.querySelector('.items');
            if (!itemsContainer) return;

            itemsContainer.innerHTML = '';

            // 如果没有memos，显示提示
            if (!memos || memos.length === 0) {
                itemsContainer.innerHTML = '<div class="empty-state"><p>还没有任何备忘录</p></div>';
                return;
            }

            // 等待 marked 库加载
            await waitForMarked();

            console.log('marked library loaded, rendering', memos.length, 'memos');

            // 渲染用户的memo
            for (const memo of memos) {
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

                // 可见性标签
                const visibilityBadge = memo.visibility === 'PRIVATE'
                    ? '<span style="display: inline-block; background: #6c757d; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-left: 4px;">🔒 私密</span>'
                    : '';

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
            \${memo.pinned ? '<span style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-left: 4px;">📌 置顶</span>' : ''}
            \${visibilityBadge}
            \${tagsHTML}
            <a href="/edit/\${memo.id}" style="margin-left: auto; padding: 4px 8px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text); font-size: 12px;">✏️ 编辑</a>
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

                    console.log('Rendering memo', memo.id, 'content length:', memo.content?.length, 'marked available:', typeof marked !== 'undefined');

                    if (typeof marked !== 'undefined') {
                        try {
                            const content = newMemoEl.textContent;
                            console.log('Parsing markdown for memo', memo.id, 'content preview:', content.substring(0, 100));
                            const parsed = marked.parse(content);
                            console.log('Parsed markdown for memo', memo.id, 'result length:', parsed.length);
                            newMemoEl.innerHTML = parsed;
                            processMarkdownImages(newMemoEl);
                            // 为新渲染的代码块添加复制按钮
                            addCopyButtonToCodeBlocks();
                        } catch (error) {
                            console.error('Error rendering markdown for memo', memo.id, error);
                        }
                    } else {
                        console.warn('marked library not loaded yet for memo', memo.id);
                    }
                } else {
                    console.error('Could not find element for memo', memo.id);
                }
            }
        } catch (error) {
            console.error('Error loading user memos:', error);
        }
    }

    // 加载更多备忘录
    async function loadMoreMemos() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const itemsContainer = document.querySelector('.items');

        if (!itemsContainer) return;

        console.log('Loading more memos, currentOffset:', currentOffset);

        // 获取当前用户信息
        const token = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');

        if (!token || !username) {
            console.error('No token or username found');
            return;
        }

        // 显示加载状态
        loadMoreBtn.style.display = 'none';
        loadingIndicator.style.display = 'block';

        try {
            // 获取当前用户信息
            const userResponse = await fetch('/api/v1/user', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to get user info');
            }

            const users = await userResponse.json();
            const currentUser = users.find(u => u.username === username);

            if (!currentUser) {
                throw new Error('Current user not found');
            }

            // 加载当前用户的memo（带分页）
            const response = await fetch(\`/api/v1/memo?creatorId=\${currentUser.id}&rowStatus=NORMAL&limit=20&offset=\${currentOffset}\`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to load memos');
            }

            const result = await response.json();
            const memos = result;  // API 现在直接返回数组

            console.log('Loaded memos count:', memos.length, 'memos:', memos.map(m => ({id: m.id, content: m.content?.substring(0, 50)})));

            if (!Array.isArray(memos) || memos.length === 0) {
                loadMoreBtn.style.display = 'none';
                loadingIndicator.textContent = '没有更多内容了';
                loadingIndicator.style.display = 'block';
                return;
            }

            // 检查是否已经加载过这些memo（防止重复）
            const existingMemoIds = new Set();
            document.querySelectorAll('.memo-content').forEach(el => {
                const id = el.id.replace('memo-', '');
                if (id) existingMemoIds.add(parseInt(id));
            });
            console.log('Existing memo IDs:', Array.from(existingMemoIds));

            // 渲染新的memos
            let addedCount = 0;
            for (const memo of memos) {
                // 跳过已经存在的memo
                if (existingMemoIds.has(memo.id)) {
                    console.log('Skipping duplicate memo:', memo.id);
                    continue;
                }

                console.log('Processing memo', memo.id, 'raw content:', memo.content);

                const avatarHash = memo.creatorEmailHash || 'default';
                const avatarUrl = \`https://gravatar.loli.net/avatar/\${avatarHash}?s=40&d=identicon\`;
                const date = new Date(memo.createdTs * 1000);
                const dateStr = date.toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'});

                // HTML转义函数 - 移到这里确保它在模板字符串之前定义
                const escapeHtml = (text) => {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                };

                // 转义memo内容
                const escapedContent = escapeHtml(memo.content || '');
                console.log('Escaped content for memo', memo.id, ':', escapedContent);

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

                // 图片资源HTML（智能布局）
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

                // 其他资源HTML
                let otherResourcesHTML = '';
                if (otherResources.length > 0) {
                    otherResourcesHTML = '<div class="memo-resources" style="margin-top: 16px;">';
                    otherResources.forEach(resource => {
                        const fileUrl = resource.externalLink || \`/api/v1/resource/\${resource.id}/file\`;
                        otherResourcesHTML += \`<a href="\${fileUrl}" class="memo-resource" target="_blank" style="display: inline-block; margin-right: 12px; margin-bottom: 8px; padding: 6px 12px; border: 1px solid var(--sepia-border); border-radius: 4px; text-decoration: none; color: var(--sepia-text);">📎 \${resource.filename}</a>\`;
                    });
                    otherResourcesHTML += '</div>';
                }

                // 标签列表
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

                // 设置内容 - 使用 textContent 避免 HTML 解析问题
                const newMemoEl = document.getElementById(\`memo-\${memo.id}\`);
                if (newMemoEl) {
                    newMemoEl.textContent = memo.content || '';
                }

                console.log('After setting textContent, element textContent:', newMemoEl?.textContent);
                if (newMemoEl) {
                    if (typeof marked !== 'undefined') {
                        try {
                            const content = newMemoEl.textContent;
                            console.log('Rendering markdown for memo', memo.id, 'content:', content);
                            const parsed = marked.parse(content);
                            console.log('Parsed result:', parsed);
                            newMemoEl.innerHTML = parsed;
                            processMarkdownImages(newMemoEl);
                        } catch (error) {
                            console.error('Error rendering markdown for memo', memo.id, error);
                        }
                    } else {
                        console.warn('marked library not loaded, skipping markdown rendering');
                    }
                }

                addedCount++;
            }

            console.log('Added', addedCount, 'new memos');
            currentOffset += memos.length;
            console.log('Updated currentOffset to:', currentOffset);

            // 检查是否还有更多 - 如果返回的数量少于limit，说明没有更多了
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

    // 创建备忘录
    document.getElementById('createMemoForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.getElementById('content').value;
        const visibility = document.getElementById('visibility').value;
        const token = localStorage.getItem('accessToken');

        if (!token) {
            showMessage('error', '登录已过期', '请先登录', function() {
                window.location.href = '/login';
            });
            return;
        }

        try {
            // 准备请求数据
            const requestData = {
                content: content,
                visibility: visibility
            };

            // 如果有上传的图片，添加资源ID列表
            if (uploadedImages.length > 0) {
                requestData.resourceIdList = uploadedImages.map(img => img.id);
            }

            const response = await fetch('/api/v1/memo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                // 成功时不显示提示，直接刷新
                uploadedImages = [];
                location.reload();
            } else {
                const error = await response.json();
                showMessage('error', '发布失败', error.message || error.error || '未知错误');
            }
        } catch (error) {
            showMessage('error', '发布失败', error.message);
        }
    });

    document.addEventListener('DOMContentLoaded', init);
</script>
`;

    return generatePage({
      title: '我的空间',
      bodyContent,
      scripts,
      siteTitle: siteSettings.site_title
    });

  } catch (error) {
    console.error('Error generating home page:', error);
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
