import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';

export async function getSettingsHTML(request, env) {
  // 获取网站设置
  const siteSettings = await getSiteSettings(env);

  const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav('/settings')}
    </div>

    <div class="main-container">
        <div class="form-card">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: var(--highlight-color); font-size: 24px;">⚙️ 系统设置</h1>
                <p style="color: var(--secondary-color); margin-top: 8px;">管理员专属功能</p>
            </div>

            <!-- 网站设置 -->
            <div style="margin-bottom: 32px;">
                <h3 style="color: var(--highlight-color); margin-bottom: 16px; font-size: 1.1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">🌐 网站设置</h3>

                <form id="siteSettingsForm">
                    <div class="form-group">
                        <label class="form-label" for="siteTitle">网站标题</label>
                        <input type="text" id="siteTitle" name="siteTitle" class="form-input" placeholder="输入网站标题">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="siteAvatar">网站头像 URL</label>
                        <input type="text" id="siteAvatar" name="siteAvatar" class="form-input" placeholder="输入头像图片 URL">
                        <small style="color: var(--secondary-color); font-size: 0.85rem;">留空则使用默认 Gravatar 头像</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center; gap: 12px;">
                            <input type="checkbox" id="allowRegistration" name="allowRegistration" style="width: 20px; height: 20px; cursor: pointer;">
                            <span>允许新用户注册</span>
                        </label>
                        <small style="color: var(--secondary-color); font-size: 0.85rem; margin-left: 32px;">取消勾选后，注册页面将不可访问</small>
                    </div>

                    <button type="submit" class="btn" style="width: 100%;">保存网站设置</button>
                </form>
            </div>

            <!-- 成员管理 -->
            <div style="margin-bottom: 32px;">
                <h3 style="color: var(--highlight-color); margin-bottom: 16px; font-size: 1.1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">👥 成员管理</h3>

                <div id="membersList" style="margin-top: 16px;">
                    <div style="text-align: center; color: var(--secondary-color); padding: 20px;">
                        加载中...
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <a href="/" style="color: var(--link-color);">← 返回首页</a>
            </div>
        </div>
    </div>
</div>

<!-- Edit Member Modal -->
<div id="editMemberModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(61, 61, 61, 0.8);">
    <div style="background-color: var(--cell-background-color); margin: 5% auto; padding: 24px; border-radius: var(--box-border-radius); width: 90%; max-width: 500px; box-shadow: var(--shadows); border: 1px solid var(--border-color);">
        <h3 style="color: var(--foreground-color); margin-bottom: 20px;">编辑成员</h3>

        <form id="editMemberForm">
            <input type="hidden" id="editUserId">

            <div class="form-group">
                <label class="form-label" for="editUsername">用户名</label>
                <input type="text" id="editUsername" class="form-input" readonly style="background-color: var(--background-color); cursor: not-allowed;">
            </div>

            <div class="form-group">
                <label class="form-label" for="editNickname">昵称</label>
                <input type="text" id="editNickname" class="form-input" required>
            </div>

            <div class="form-group">
                <label class="form-label" for="editEmail">邮箱</label>
                <input type="email" id="editEmail" class="form-input">
            </div>

            <div class="form-group">
                <label class="form-label" for="editRole">角色</label>
                <select id="editRole" class="form-input">
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                </select>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 24px;">
                <button type="submit" class="btn" style="flex: 1;">保存修改</button>
                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">取消</button>
            </div>
        </form>
    </div>
</div>

<!-- Message Modal -->
<div id="messageModal" style="display: none; position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(61, 61, 61, 0.8);">
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
<script>
    let currentUserData = null;

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

    // Click outside to close
    document.addEventListener('DOMContentLoaded', function() {
        const messageModal = document.getElementById('messageModal');
        if (messageModal) {
            messageModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    hideMessage();
                }
            });
        }

        const editModal = document.getElementById('editMemberModal');
        if (editModal) {
            editModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeEditModal();
                }
            });
        }
    });

    // 验证管理员权限
    async function checkAdminPermission() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', '未登录', '请先登录', function() {
                window.location.href = '/login';
            });
            return false;
        }

        try {
            const response = await fetch('/api/v1/user', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }

            const users = await response.json();
            const currentUsername = localStorage.getItem('username');
            const currentUser = users.find(u => u.username === currentUsername);

            if (!currentUser) {
                throw new Error('找不到当前用户');
            }

            currentUserData = currentUser;

            // 检查是否是管理员
            if (currentUser.role !== 'admin' && !currentUser.is_admin) {
                showMessage('error', '权限不足', '此页面仅管理员可访问', function() {
                    window.location.href = '/';
                });
                return false;
            }

            return true;
        } catch (error) {
            showMessage('error', '验证失败', error.message, function() {
                window.location.href = '/';
            });
            return false;
        }
    }

    // 加载网站设置
    async function loadSiteSettings() {
        try {
            const response = await fetch('/api/v1/settings/public');

            if (!response.ok) {
                throw new Error('获取设置失败');
            }

            const settings = await response.json();

            document.getElementById('siteTitle').value = settings.site_title || 'Memos';
            document.getElementById('siteAvatar').value = settings.site_avatar || '';
            document.getElementById('allowRegistration').checked = settings.allow_registration === 'true';
        } catch (error) {
            console.error('Error loading site settings:', error);
            showMessage('error', '加载失败', '无法加载网站设置');
        }
    }

    // 保存网站设置
    document.getElementById('siteSettingsForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', '未登录', '请先登录');
            return;
        }

        const siteTitle = document.getElementById('siteTitle').value;
        const siteAvatar = document.getElementById('siteAvatar').value;
        const allowRegistration = document.getElementById('allowRegistration').checked;

        try {
            // 更新三个设置
            const updates = [
                fetch('/api/v1/settings/site_title', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ value: siteTitle })
                }),
                fetch('/api/v1/settings/site_avatar', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ value: siteAvatar })
                }),
                fetch('/api/v1/settings/allow_registration', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ value: allowRegistration ? 'true' : 'false' })
                })
            ];

            const results = await Promise.all(updates);

            // 检查是否所有请求都成功
            const allSuccess = results.every(r => r.ok);

            if (allSuccess) {
                showMessage('success', '保存成功', '网站设置已更新，刷新页面后生效', function() {
                    location.reload();
                });
            } else {
                showMessage('error', '保存失败', '部分设置更新失败');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', '保存失败', error.message);
        }
    });

    // 加载成员列表
    async function loadMembers() {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const response = await fetch('/api/v1/user', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!response.ok) {
                throw new Error('获取成员列表失败');
            }

            const users = await response.json();
            renderMembersList(users);
        } catch (error) {
            console.error('Error loading members:', error);
            document.getElementById('membersList').innerHTML =
                '<div style="text-align: center; color: #dc3545; padding: 20px;">加载失败</div>';
        }
    }

    // 渲染成员列表
    function renderMembersList(users) {
        const membersList = document.getElementById('membersList');

        if (!users || users.length === 0) {
            membersList.innerHTML = '<div style="text-align: center; color: var(--secondary-color); padding: 20px;">暂无成员</div>';
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

        users.forEach(user => {
            const isCurrentUser = currentUserData && user.id === currentUserData.id;
            const roleText = user.role === 'admin' || user.is_admin ? '管理员' : '用户';
            const roleColor = user.role === 'admin' || user.is_admin ? '#28a745' : 'var(--secondary-color)';

            html += \`
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--sepia-surface); border: 1px solid var(--sepia-border); border-radius: 8px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span style="font-weight: 500; color: var(--foreground-color); font-size: 16px;">\${user.nickname || user.username}</span>
                            <span style="color: \${roleColor}; font-size: 12px; padding: 2px 8px; background: var(--background-color); border-radius: 4px; border: 1px solid \${roleColor};">\${roleText}</span>
                            \${isCurrentUser ? '<span style="color: var(--highlight-color); font-size: 12px;">(当前用户)</span>' : ''}
                        </div>
                        <div style="color: var(--secondary-color); font-size: 14px;">
                            用户名: \${user.username} | ID: \${user.id}\${user.email ? ' | ' + user.email : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="editMember(\${user.id})">编辑</button>
                        \${!isCurrentUser ? \`<button class="btn" style="padding: 6px 12px; font-size: 14px; background: #dc3545; border-color: #dc3545;" onclick="deleteMember(\${user.id}, '\${user.username}')">删除</button>\` : ''}
                    </div>
                </div>
            \`;
        });

        html += '</div>';
        membersList.innerHTML = html;
    }

    // 编辑成员
    window.editMember = async function(userId) {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const response = await fetch('/api/v1/user', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }

            const users = await response.json();
            const user = users.find(u => u.id === userId);

            if (!user) {
                showMessage('error', '错误', '找不到该用户');
                return;
            }

            // 填充表单
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editNickname').value = user.nickname || '';
            document.getElementById('editEmail').value = user.email || '';
            document.getElementById('editRole').value = user.role || 'user';

            // 显示模态框
            document.getElementById('editMemberModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading user:', error);
            showMessage('error', '加载失败', error.message);
        }
    };

    // 关闭编辑模态框
    window.closeEditModal = function() {
        document.getElementById('editMemberModal').style.display = 'none';
    };

    // 保存成员编辑
    document.getElementById('editMemberForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', '未登录', '请先登录');
            return;
        }

        const userId = document.getElementById('editUserId').value;
        const nickname = document.getElementById('editNickname').value;
        const email = document.getElementById('editEmail').value;
        const role = document.getElementById('editRole').value;

        try {
            const response = await fetch('/api/v1/user/' + userId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    nickname: nickname,
                    email: email || null,
                    role: role
                })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', '更新成功', '成员信息已更新', function() {
                    closeEditModal();
                    loadMembers();
                });
            } else {
                showMessage('error', '更新失败', result.error || result.message || '未知错误');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showMessage('error', '更新失败', error.message);
        }
    });

    // 删除成员
    window.deleteMember = async function(userId, username) {
        if (!confirm(\`确定要删除用户 "\${username}" 吗？此操作不可恢复！\`)) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', '未登录', '请先登录');
            return;
        }

        try {
            const response = await fetch('/api/v1/user/' + userId, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (response.ok) {
                showMessage('success', '删除成功', '用户已删除', function() {
                    loadMembers();
                });
            } else {
                const result = await response.json();
                showMessage('error', '删除失败', result.error || result.message || '未知错误');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('error', '删除失败', error.message);
        }
    };

    // 页面初始化
    window.addEventListener('load', async function() {
        const isAdmin = await checkAdminPermission();
        if (isAdmin) {
            await loadSiteSettings();
            await loadMembers();
        }
    });
</script>
`;

  return generatePage({
    title: '系统设置',
    bodyContent,
    scripts,
    siteTitle: siteSettings.site_title
  });
}
