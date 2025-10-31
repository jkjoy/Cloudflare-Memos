import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';

export async function getProfileHTML(request, env) {
  // 获取网站设置
  const siteSettings = await getSiteSettings(env);

  const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav('/profile')}
    </div>

    <div class="main-container">
        <div class="form-card">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: var(--highlight-color); font-size: 24px;">个人资料</h1>
                <p style="color: var(--secondary-color); margin-top: 8px;">管理您的账户信息</p>
            </div>

            <form id="profileForm">
                <div class="form-group">
                    <label class="form-label" for="userId">用户 ID</label>
                    <input type="text" id="userId" class="form-input" readonly style="background-color: var(--background-color); cursor: not-allowed;">
                    <small style="color: var(--secondary-color); font-size: 0.85rem; font-style: italic;">用户 ID 不可修改</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="username">用户名</label>
                    <input type="text" id="username" class="form-input" readonly style="background-color: var(--background-color); cursor: not-allowed;">
                    <small style="color: var(--secondary-color); font-size: 0.85rem; font-style: italic;">用户名不可修改</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="nickname">
                        昵称 <span style="color: #28a745; font-size: 0.85rem;">✓ 可编辑</span>
                    </label>
                    <input type="text" id="nickname" name="nickname" class="form-input" placeholder="输入您的昵称（支持中文）" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="email">
                        邮箱 <span style="color: #28a745; font-size: 0.85rem;">✓ 可编辑</span>
                    </label>
                    <input type="email" id="email" name="email" class="form-input" placeholder="输入邮箱地址（用于显示头像）">
                    <small style="color: var(--secondary-color); font-size: 0.85rem;">用于 Gravatar 头像显示</small>
                </div>

                <div style="margin: 24px 0; padding-top: 20px; border-top: 1px solid var(--border-color);">
                    <h3 style="color: var(--highlight-color); margin-bottom: 16px; font-size: 1.1rem;">🔒 修改密码</h3>

                    <div class="form-group">
                        <label class="form-label" for="currentPassword">当前密码</label>
                        <input type="password" id="currentPassword" name="currentPassword" class="form-input" placeholder="输入当前密码">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="newPassword">新密码</label>
                        <input type="password" id="newPassword" name="newPassword" class="form-input" placeholder="输入新密码（至少 6 个字符）">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="confirmPassword">确认新密码</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" class="form-input" placeholder="再次输入新密码">
                    </div>

                    <button type="button" class="btn" style="width: 100%; margin-bottom: 16px; background-color: #c82333; border-color: #c82333; color: white;" onclick="changePassword()">修改密码</button>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn" style="flex: 1;">保存修改</button>
                    <button type="button" class="btn btn-secondary" onclick="loadUserInfo()">刷新信息</button>
                </div>
            </form>

            <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <a href="/" style="color: var(--link-color);">← 返回首页</a>
            </div>
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
<script>
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

    let currentUserId = null;

    async function loadUserInfo() {
        const token = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');

        if (!token || !username) {
            showMessage('error', '登录已过期', '请先登录', function() {
                window.location.href = '/login';
            });
            return;
        }

        try {
            // 从 API 获取最新的用户信息
            const response = await fetch('/api/v1/user', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }

            const users = await response.json();
            const currentUser = users.find(u => u.username === username);

            if (!currentUser) {
                throw new Error('找不到当前用户');
            }

            // 更新 localStorage 中的用户数据
            localStorage.setItem('memos_user', JSON.stringify(currentUser));

            // 填充表单
            currentUserId = currentUser.id;
            document.getElementById('userId').value = currentUser.id;
            document.getElementById('username').value = currentUser.username;
            document.getElementById('nickname').value = currentUser.nickname || '';
            document.getElementById('email').value = currentUser.email || '';
        } catch (error) {
            showMessage('error', '加载失败', '用户数据加载失败: ' + error.message);
        }
    }

    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!currentUserId) {
            showMessage('error', '错误', '请先加载用户信息');
            return;
        }

        const nickname = document.getElementById('nickname').value;
        const email = document.getElementById('email').value;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', '登录已过期', '请先登录', function() {
                window.location.href = '/login';
            });
            return;
        }

        if (!nickname) {
            showMessage('error', '错误', '请输入昵称');
            return;
        }

        try {
            const response = await fetch('/api/v1/user/' + currentUserId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    nickname: nickname,
                    email: email || null
                })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', '更新成功', '个人资料更新成功！', function() {
                    const userData = JSON.parse(localStorage.getItem('memos_user'));
                    userData.nickname = nickname;
                    userData.email = email;
                    localStorage.setItem('memos_user', JSON.stringify(userData));
                });
            } else {
                showMessage('error', '更新失败', result.error || result.message || '未知错误');
            }
        } catch (error) {
            showMessage('error', '更新失败', error.message);
        }
    });

    async function changePassword() {
        if (!currentUserId) {
            showMessage('error', '错误', '请先加载用户信息');
            return;
        }

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword) {
            showMessage('error', '错误', '请输入当前密码');
            return;
        }

        if (!newPassword) {
            showMessage('error', '错误', '请输入新密码');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('error', '错误', '新密码至少需要 6 个字符');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('error', '错误', '两次输入的新密码不一致');
            return;
        }

        if (currentPassword === newPassword) {
            showMessage('error', '错误', '新密码不能与当前密码相同');
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            showMessage('error', '登录已过期', '请先登录', function() {
                window.location.href = '/login';
            });
            return;
        }

        try {
            const response = await fetch('/api/v1/user/' + currentUserId + '/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', '修改成功', '密码修改成功！', function() {
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                });
            } else {
                showMessage('error', '修改失败', result.error || result.message || '未知错误');
            }
        } catch (error) {
            showMessage('error', '修改失败', error.message);
        }
    }

    window.addEventListener('load', function() {
        loadUserInfo();
    });

    window.changePassword = changePassword;
</script>
`;

  return generatePage({
    title: '个人资料',
    bodyContent,
    scripts,
    siteTitle: siteSettings.site_title
  });
}
