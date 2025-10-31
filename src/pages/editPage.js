import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';

/**
 * 生成编辑备忘录页面 HTML
 */
export async function getEditPageHTML(request, env) {
  try {
    const url = new URL(request.url);
    const memoId = url.pathname.split('/').pop();

    // 获取网站设置
    const siteSettings = await getSiteSettings(env);

    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav()}
    </div>

    <div class="main-container">
        <div class="form-card" id="editForm">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <h3 class="form-title" style="margin: 0;">编辑备忘录</h3>
                <a href="/" class="btn btn-secondary" style="text-decoration: none; padding: 8px 16px;">← 返回首页</a>
            </div>

            <form id="editMemoForm">
                <input type="hidden" id="memoId" value="${memoId}">

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
                        <button type="button" class="editor-btn" onclick="togglePreview()" title="预览">
                            👁️
                        </button>
                    </div>

                    <textarea id="content" name="content" class="form-textarea" placeholder="支持 Markdown 语法" required style="border-radius: 0 0 4px 4px; min-height: 200px; font-family: var(--font-mono);"></textarea>

                    <!-- 预览区域 -->
                    <div id="preview" style="display: none; padding: 16px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px; margin-top: 8px; min-height: 150px;">
                        <div style="color: var(--sepia-text-muted); font-size: 14px; margin-bottom: 8px;">预览：</div>
                        <div id="previewContent" class="markdown-content"></div>
                    </div>

                    <!-- 文件上传按钮 -->
                    <div style="margin-top: 12px;">
                        <label class="editor-btn" style="cursor: pointer; padding: 8px 16px; display: inline-block;" title="上传文件（支持多选）">
                            📎 上传附件
                            <input type="file" id="fileUpload" accept="image/*,video/*,audio/*,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md" multiple style="display: none;" onchange="uploadFiles(this)">
                        </label>
                        <span id="uploadStatus" style="color: var(--sepia-text-muted); font-size: 14px; margin-left: 12px;"></span>
                    </div>

                    <!-- 现有附件列表 -->
                    <div id="existingResources" style="display: none; margin-top: 12px; padding: 12px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px;">
                        <div style="color: var(--sepia-text-muted); font-size: 14px; margin-bottom: 8px;">现有附件：</div>
                        <div id="existingResourcesList"></div>
                    </div>

                    <!-- 新上传的文件预览区域 -->
                    <div id="newResourcesContainer" style="display: none; margin-top: 12px; padding: 12px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 4px;">
                        <div style="color: var(--sepia-text-muted); font-size: 14px; margin-bottom: 8px;">新上传的文件：</div>
                        <div id="newResourcesList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;"></div>
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

                <!-- 置顶选项 -->
                <div class="form-group">
                    <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                        <input type="checkbox" id="pinned" name="pinned" style="width: 18px; height: 18px; margin-right: 8px; cursor: pointer;">
                        <span class="form-label" style="margin: 0; cursor: pointer;">📌 置顶此备忘录</span>
                    </label>
                    <small style="color: var(--secondary-color); font-size: 12px; margin-top: 4px; display: block; margin-left: 26px;">置顶的备忘录会显示在列表最前面</small>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button type="submit" class="btn" style="flex: 1;">💾 保存更改</button>
                    <button type="button" class="btn" style="flex: 1; background: #dc3545;" onclick="deleteMemo()">🗑️ 删除</button>
                </div>
            </form>
        </div>

        <!-- 加载提示 -->
        <div id="loadingPrompt" class="empty-state">
            <h3>加载中...</h3>
            <p>正在获取备忘录信息</p>
        </div>

        <!-- 错误提示 -->
        <div id="errorPrompt" class="empty-state" style="display: none;">
            <h3>加载失败</h3>
            <p id="errorMessage">备忘录不存在或无权访问</p>
            <a href="/" class="btn" style="display: inline-block; margin-top: 16px;">返回首页</a>
        </div>
    </div>
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

<script>
    // 配置 marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
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

    // 存储附件信息
    let existingResources = []; // 原有附件
    let resourcesToDelete = []; // 要删除的附件ID
    let newUploadedResources = []; // 新上传的附件

    // 根据文件类型返回图标
    function getFileIcon(type, filename) {
        if (!type) type = '';
        if (type.includes('pdf')) return '📄';
        if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gzip')) return '📦';
        if (type.includes('word') || type.includes('document') || filename.endsWith('.doc') || filename.endsWith('.docx')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet') || filename.endsWith('.xls') || filename.endsWith('.xlsx')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation') || filename.endsWith('.ppt') || filename.endsWith('.pptx')) return '📊';
        if (type.includes('text') || filename.endsWith('.txt') || filename.endsWith('.md')) return '📃';
        if (type.includes('json') || type.includes('xml')) return '🗂️';
        if (type.includes('image')) return '🖼️';
        if (type.includes('video')) return '🎬';
        if (type.includes('audio')) return '🎵';
        return '📎';
    }

    // 显示现有附件
    function showExistingResources() {
        const container = document.getElementById('existingResources');
        const list = document.getElementById('existingResourcesList');

        if (existingResources.length === 0 || existingResources.every(r => resourcesToDelete.includes(r.id))) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        list.innerHTML = '';

        // 分离图片和非图片资源
        const imageResources = existingResources.filter(r => !resourcesToDelete.includes(r.id) && r.type && r.type.startsWith('image/'));
        const otherResources = existingResources.filter(r => !resourcesToDelete.includes(r.id) && (!r.type || !r.type.startsWith('image/')));

        // 显示图片资源（网格布局）
        if (imageResources.length > 0) {
            const imageGrid = document.createElement('div');
            imageGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 12px;';

            imageResources.forEach(resource => {
                const item = document.createElement('div');
                item.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--sepia-border); box-shadow: var(--shadows); background: var(--sepia-surface);';

                item.innerHTML = \`
                    <img src="\${resource.filepath}" alt="\${resource.filename}" style="width: 100%; height: 120px; object-fit: cover; display: block;">
                    <div style="padding: 4px 8px; background: rgba(0,0,0,0.7); color: white; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${resource.filename}">\${resource.filename}</div>
                    <button type="button" onclick="deleteExistingResource(\${resource.id})" style="position: absolute; top: 4px; right: 4px; background: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center;" title="删除">×</button>
                \`;

                imageGrid.appendChild(item);
            });

            list.appendChild(imageGrid);
        }

        // 显示其他资源（列表布局）
        otherResources.forEach(resource => {
            const icon = getFileIcon(resource.type, resource.filename);

            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--sepia-border); border-radius: 4px; margin-bottom: 8px; background: var(--cell-background-color);';

            item.innerHTML = \`
                <span style="font-size: 24px;">\${icon}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--foreground-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${resource.filename}</div>
                    <div style="font-size: 12px; color: var(--secondary-color);">\${resource.size ? (resource.size / 1024).toFixed(1) + ' KB' : ''}</div>
                </div>
                <button type="button" onclick="deleteExistingResource(\${resource.id})" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
            \`;

            list.appendChild(item);
        });
    }

    // 删除现有附件
    function deleteExistingResource(resourceId) {
        if (!resourcesToDelete.includes(resourceId)) {
            resourcesToDelete.push(resourceId);
        }
        showExistingResources();
    }

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
                    // 确保filepath是绝对路径
                    let filepath = result.filepath;
                    if (filepath && !filepath.startsWith('http') && !filepath.startsWith('/')) {
                        filepath = '/' + filepath;
                    }
                    newUploadedResources.push({
                        id: result.id,
                        filename: result.filename,
                        filepath: filepath,
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
        showNewResources();

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

    // 显示新上传的文件
    function showNewResources() {
        const container = document.getElementById('newResourcesContainer');
        const list = document.getElementById('newResourcesList');

        if (newUploadedResources.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        list.innerHTML = '';

        newUploadedResources.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--sepia-border); box-shadow: var(--shadows); background: var(--sepia-surface);';

            const isImage = file.type && file.type.startsWith('image/');
            const isVideo = file.type && file.type.startsWith('video/');
            const isAudio = file.type && file.type.startsWith('audio/');

            let previewHTML = '';
            if (isImage) {
                previewHTML = \`<img src="\${file.filepath}" alt="\${file.filename}" style="width: 100%; height: 120px; object-fit: cover; display: block;">\`;
            } else if (isVideo) {
                previewHTML = \`<div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px;">🎬</div>
                        <div style="font-size: 12px; margin-top: 4px;">\${file.filename}</div>
                    </div>
                </div>\`;
            } else if (isAudio) {
                previewHTML = \`<div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px;">🎵</div>
                        <div style="font-size: 12px; margin-top: 4px;">\${file.filename}</div>
                    </div>
                </div>\`;
            } else {
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
                <button type="button" onclick="removeNewResource(\${index})" style="position: absolute; top: 4px; right: 4px; background: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center;" title="删除">×</button>
            \`;

            list.appendChild(previewItem);
        });
    }

    // 删除新上传的文件
    function removeNewResource(index) {
        newUploadedResources.splice(index, 1);
        showNewResources();
    }

    // 加载备忘录数据
    async function loadMemo() {
        const memoId = document.getElementById('memoId').value;
        const token = localStorage.getItem('accessToken');

        if (!token) {
            document.getElementById('loadingPrompt').style.display = 'none';
            document.getElementById('errorPrompt').style.display = 'block';
            document.getElementById('errorMessage').textContent = '请先登录';
            return;
        }

        try {
            const response = await fetch(\`/api/v1/memo/\${memoId}\`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load memo');
            }

            const memo = await response.json();

            // 填充表单
            document.getElementById('content').value = memo.content || '';
            document.getElementById('visibility').value = memo.visibility || 'PUBLIC';
            document.getElementById('pinned').checked = memo.pinned || false;

            // 加载附件
            if (memo.resourceList && memo.resourceList.length > 0) {
                existingResources = memo.resourceList.map(r => {
                    // 确保filepath是绝对路径
                    let filepath = r.externalLink || r.filepath;
                    if (filepath && !filepath.startsWith('http') && !filepath.startsWith('/')) {
                        filepath = '/' + filepath;
                    }
                    return {
                        id: r.id,
                        filename: r.filename,
                        filepath: filepath,
                        type: r.type,
                        size: r.size
                    };
                });
                showExistingResources();
            }

            // 显示编辑表单
            document.getElementById('loadingPrompt').style.display = 'none';
            document.getElementById('editForm').style.display = 'block';

        } catch (error) {
            console.error('Error loading memo:', error);
            document.getElementById('loadingPrompt').style.display = 'none';
            document.getElementById('errorPrompt').style.display = 'block';
        }
    }

    // 保存备忘录
    document.getElementById('editMemoForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const memoId = document.getElementById('memoId').value;
        const content = document.getElementById('content').value;
        const visibility = document.getElementById('visibility').value;
        const pinned = document.getElementById('pinned').checked;
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
                visibility: visibility,
                pinned: pinned
            };

            // 添加要删除的附件ID列表
            if (resourcesToDelete.length > 0) {
                requestData.deleteResourceIds = resourcesToDelete;
            }

            // 添加新上传的附件ID列表
            if (newUploadedResources.length > 0) {
                requestData.resourceIdList = newUploadedResources.map(r => r.id);
            }

            const response = await fetch(\`/api/v1/memo/\${memoId}\`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                showMessage('success', '保存成功', '备忘录已更新', function() {
                    window.location.href = '/';
                });
            } else {
                const error = await response.json();
                showMessage('error', '保存失败', error.message || error.error || '未知错误');
            }
        } catch (error) {
            showMessage('error', '保存失败', error.message);
        }
    });

    // 删除备忘录
    async function deleteMemo() {
        if (!confirm('确定要删除这条备忘录吗？此操作无法撤销。')) {
            return;
        }

        const memoId = document.getElementById('memoId').value;
        const token = localStorage.getItem('accessToken');

        if (!token) {
            showMessage('error', '登录已过期', '请先登录', function() {
                window.location.href = '/login';
            });
            return;
        }

        try {
            const response = await fetch(\`/api/v1/memo/\${memoId}\`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (response.ok) {
                showMessage('success', '删除成功', '备忘录已删除', function() {
                    window.location.href = '/';
                });
            } else {
                const error = await response.json();
                showMessage('error', '删除失败', error.message || error.error || '未知错误');
            }
        } catch (error) {
            showMessage('error', '删除失败', error.message);
        }
    }

    // 页面加载时初始化
    document.addEventListener('DOMContentLoaded', async function() {
        await checkLoginStatus();
        loadMemo();
    });

    // 全局暴露函数
    window.deleteExistingResource = deleteExistingResource;
    window.removeNewResource = removeNewResource;
    window.uploadFiles = uploadFiles;
    window.deleteMemo = deleteMemo;
</script>
`;

    return generatePage({
      title: '编辑备忘录',
      bodyContent,
      scripts,
      siteTitle: siteSettings.site_title
    });

  } catch (error) {
    console.error('Error generating edit page:', error);
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
