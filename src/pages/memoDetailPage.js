import { getGravatarUrl } from '../utils/gravatar.js';
import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';

export async function getMemoDetailHTML(request, env, memoId) {
  try {
    const db = env.DB;

    // 获取网站设置
    const siteSettings = await getSiteSettings(env);

    // 直接从数据库获取 memo
    const memoStmt = db.prepare(`
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
      WHERE m.id = ?
    `);

    const memo = await memoStmt.bind(memoId).first();

    if (!memo) {
      throw new Error('备忘录不存在');
    }

    // 获取资源列表
    const resourceStmt = db.prepare(`
      SELECT r.id, r.filename, r.filepath, r.type, r.size
      FROM resources r
      JOIN memo_resources mr ON r.id = mr.resource_id
      WHERE mr.memo_id = ?
    `);
    const { results: resources } = await resourceStmt.bind(memoId).all();

    // 转换资源路径为代理路径
    memo.resourceList = (resources || []).map(r => ({
      ...r,
      filepath: r.filepath.startsWith('http') || r.filepath.startsWith('/api/')
        ? r.filepath
        : `/api/v1/resource/${r.id}/file`
    }));

    // 获取用户头像URL
    let avatarUrl = getGravatarUrl(memo.creatorEmail, 40, env);

    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav()}
    </div>

    <div class="main-container">
        <!-- Breadcrumb -->
        <div style="padding: 10px 0; margin-bottom: 24px; display: flex; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
            <img src="${avatarUrl}" alt="${memo.creatorName}" style="width: 24px; height: 24px; border-radius: 100%; border: 2px solid #fff; box-shadow: var(--shadows); display: block;">
            <div style="flex: 1; font-size: 14px; margin-left: 10px; color: var(--secondary-color);">
                <a href="/explore" style="color: var(--secondary-color); text-decoration: none;">广场</a>
                <span style="margin: 0 0.5rem;">/</span>
                <a href="/user/${memo.creatorId}" style="color: var(--secondary-color); text-decoration: none;">${memo.creatorName || memo.creatorUsername}</a>
                <span style="margin: 0 0.5rem;">/</span>
                <span style="color: var(--foreground-color);">备忘录详情</span>
            </div>
        </div>

        <!-- Memo Detail -->
        <div class="items">
            <div class="item">
                <!-- Time Box -->
                <div class="time-box">
                    <div class="dot"></div>
                    <div class="time">
                        <time datetime="${new Date(memo.createdTs * 1000).toISOString()}" title="${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}">
                            ${new Date(memo.createdTs * 1000).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                weekday: 'short'
                            })}
                        </time>
                        ${memo.updatedTs !== memo.createdTs ? `<span style="color: var(--secondary-color); font-size: 12px; margin-left: 8px;">(已更新 ${new Date(memo.updatedTs * 1000).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})</span>` : ''}
                    </div>
                </div>

                <!-- Content Box -->
                <div class="memo-box">
                    ${memo.pinned ? '<div style="display: inline-block; background: var(--highlight-color); color: #fff; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-bottom: 16px;">📌 置顶</div><br>' : ''}
                    <div id="memoContent" class="memo-text markdown-content">${memo.content}</div>
                </div>

                ${memo.resourceList && memo.resourceList.length > 0 ? (() => {
                    // 分离图片和非图片资源
                    const imageResources = memo.resourceList.filter(r => r.type && r.type.startsWith('image/'));
                    const otherResources = memo.resourceList.filter(r => !r.type || !r.type.startsWith('image/'));

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
                      `<div style="border-left: 2px solid var(--border-color); padding: 20px 0 0 30px; margin-left: 3px; margin-top: 16px;">
                        <strong style="color: var(--secondary-color); font-size: 14px; display: block; margin-bottom: 12px;">📎 附件:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${otherResources.map(resource =>
                              `<a href="${resource.filepath}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: var(--box-border-radius); text-decoration: none; color: var(--foreground-color); background: var(--code-background-color); font-size: 14px;">
                                📄 ${resource.filename} ${resource.size ? `<span style="opacity: 0.7;">(${(resource.size / 1024).toFixed(1)} KB)</span>` : ''}
                              </a>`
                            ).join('')}
                        </div>
                      </div>` : '';

                    return imagesHTML + otherResourcesHTML;
                })() : ''}

                <!-- Edit Form (Hidden by Default) -->
                <div id="editForm" style="display: none; border-left: 2px solid var(--border-color); padding: 30px 0 30px 30px; margin-left: 3px; margin-top: 20px;">
                    <h3 style="margin-bottom: 16px; color: var(--highlight-color); font-size: 18px;">✏️ 编辑备忘录</h3>
                    <form id="updateMemoForm">
                        <div class="form-group">
                            <label class="form-label" for="editContent">内容</label>
                            <textarea id="editContent" name="content" class="form-textarea" required>${memo.content}</textarea>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="btn">保存修改</button>
                            <button type="button" class="btn btn-secondary" onclick="toggleEditForm()">取消</button>
                        </div>
                    </form>
                </div>

                <!-- Action Buttons -->
                <div style="border-left: 2px solid var(--border-color); padding: 30px 0 10px 30px; margin-left: 3px;">
                    <div id="guestActions" style="display: none; text-align: center;">
                        <p style="color: var(--secondary-color); margin-bottom: 12px; font-size: 14px;">请登录后编辑此备忘录</p>
                        <a href="/login" class="btn">登录</a>
                    </div>
                    <div id="userActions" style="display: none; display: flex; gap: 10px; justify-content: flex-start;">
                        <button class="btn-outline" onclick="toggleEditForm()">✏️ 编辑</button>
                        <button class="btn-outline" onclick="showDeleteConfirm()">🗑️ 删除</button>
                    </div>
                    <div id="noPermissionActions" style="display: none;">
                        <p style="color: var(--secondary-color); font-style: italic; font-size: 14px;">只有创建者或管理员可以编辑此备忘录</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(61, 61, 61, 0.8);">
    <div style="background-color: var(--cell-background-color); margin: 10% auto; padding: 24px; border-radius: var(--box-border-radius); width: 90%; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid var(--border-color);">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="color: var(--foreground-color); margin-bottom: 12px;">确认删除</h3>
        <p style="color: var(--secondary-color); margin-bottom: 24px;">
            您确定要删除这条备忘录吗？<br>
            <strong style="color: #c82333;">此操作无法撤销！</strong>
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn-outline" onclick="hideDeleteConfirm()">取消</button>
            <button class="btn-outline" style="color: #c82333; border-color: #c82333;" onclick="confirmDelete()">删除</button>
        </div>
    </div>
</div>

<!-- Message Modal -->
<div id="messageModal" style="display: none; position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(61, 61, 61, 0.8);">
    <div style="background-color: var(--cell-background-color); margin: 10% auto; padding: 24px; border-radius: var(--box-border-radius); width: 90%; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid var(--border-color);">
        <div id="messageIcon" style="font-size: 48px; margin-bottom: 16px;">ℹ️</div>
        <h3 id="messageTitle" style="color: var(--foreground-color); margin-bottom: 12px;">消息</h3>
        <p id="messageText" style="color: var(--secondary-color); margin-bottom: 24px;"></p>
        <button class="btn" onclick="hideMessage()">确定</button>
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

    // 渲染 Markdown
    function renderMarkdown() {
        if (typeof marked === 'undefined') return;

        const memoText = document.querySelector('.memo-text');
        if (memoText) {
            const content = memoText.textContent;
            const parent = memoText.closest('.markdown-content');
            if (parent) {
                const pinnedBadge = parent.querySelector('div[style*="PINNED"]');
                parent.innerHTML = (pinnedBadge ? pinnedBadge.outerHTML + '<br>' : '') + marked.parse(content);

                // 处理图片
                processMarkdownImages(parent);

                // 为代码块添加复制按钮
                addCopyButtonToCodeBlocks();
            }
        }
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

    async function checkEditPermission() {
        const token = localStorage.getItem('accessToken');

        if (token) {
            try {
                // 通过API获取用户信息
                const response = await fetch('/api/v1/user', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });

                if (response.ok) {
                    const users = await response.json();
                    const currentUsername = localStorage.getItem('username');
                    const user = users.find(u => u.username === currentUsername);

                    if (user) {
                        const memoCreatorId = ${memo.creatorId};
                        const canEdit = (user.id === memoCreatorId) || user.is_admin;

                        if (canEdit) {
                            document.getElementById('guestActions').style.display = 'none';
                            document.getElementById('userActions').style.display = 'flex';
                        } else {
                            document.getElementById('guestActions').style.display = 'none';
                            document.getElementById('userActions').style.display = 'none';
                            document.getElementById('noPermissionActions').style.display = 'block';
                        }
                        return true;
                    }
                }
            } catch (error) {
                console.error('Failed to validate user:', error);
            }
        }

        document.getElementById('guestActions').style.display = 'block';
        document.getElementById('userActions').style.display = 'none';
        document.getElementById('noPermissionActions').style.display = 'none';
        return false;
    }

    async function toggleEditForm() {
        const isLoggedIn = await checkEditPermission();
        if (!isLoggedIn) {
            showMessage('error', 'Login Required', 'Please login first', function() {
                window.location.href = '/login';
            });
            return;
        }

        const form = document.getElementById('editForm');
        form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
    }

    function showDeleteConfirm() {
        const sessionData = localStorage.getItem('memos_session');
        if (!sessionData) {
            showMessage('error', 'Login Required', 'Please login first', function() {
                window.location.href = '/login';
            });
            return;
        }

        document.getElementById('deleteModal').style.display = 'block';
    }

    function hideDeleteConfirm() {
        document.getElementById('deleteModal').style.display = 'none';
    }

    function confirmDelete() {
        hideDeleteConfirm();
        deleteMemo();
    }

    document.getElementById('updateMemoForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.getElementById('editContent').value;

        if (!content.trim()) {
            showMessage('error', 'Error', 'Please enter memo content');
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', 'Login Required', 'Please login first', function() {
                window.location.href = '/login';
            });
            return;
        }

        try {
            const response = await fetch('/api/v1/memo/${memo.id}', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ content })
            });

            const result = await response.json();

            if (response.ok) {
                // 成功时不显示提示，直接刷新
                location.reload();
            } else {
                showMessage('error', 'Update Failed', result.error || result.message || 'Unknown error');
            }
        } catch (error) {
            showMessage('error', 'Update Failed', error.message);
        }
    });

    async function deleteMemo() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', 'Login Required', 'Please login first', function() {
                window.location.href = '/login';
            });
            return;
        }

        try {
            const response = await fetch('/api/v1/memo/${memo.id}', {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', 'Success', 'Memo deleted successfully!', function() {
                    window.location.href = '/';
                });
            } else {
                showMessage('error', 'Delete Failed', result.error || result.message || 'Unknown error');
            }
        } catch (error) {
            showMessage('error', 'Delete Failed', error.message);
        }
    }

    window.addEventListener('load', async function() {
        await checkEditPermission();
        renderMarkdown();
    });
</script>
`;

    return generatePage({
      title: `备忘录详情`,
      bodyContent,
      scripts,
      siteTitle: siteSettings.site_title
    });
  } catch (error) {
    console.error('Error generating memo detail HTML:', error);
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>错误 - 备忘录</title>
</head>
<body>
    <div style="padding: 20px; text-align: center;">
        <h1>加载失败</h1>
        <p>无法加载备忘录: ${error.message}</p>
        <a href="/explore">返回广场</a>
    </div>
</body>
</html>`;
  }
}
