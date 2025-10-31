import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';

/**
 * 生成登录页 HTML
 */
export async function getLoginPageHTML(request, env) {
  // 获取网站设置
  const siteSettings = await getSiteSettings(env);

  const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav()}
    </div>

    <div class="main-container">
        <!-- Login Card -->
        <div style="background-color: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows); border: 1px solid var(--border-color); padding: 32px; max-width: 480px; margin: 40px auto;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                <h2 style="color: var(--highlight-color); margin-bottom: 8px; font-size: 24px;">欢迎回来</h2>
                <p style="color: var(--secondary-color); font-size: 14px;">登录您的账户以继续</p>
            </div>

            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label" for="username">用户名</label>
                    <input type="text" id="username" name="username" class="form-input" placeholder="输入您的用户名" required autofocus>
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">密码</label>
                    <input type="password" id="password" name="password" class="form-input" placeholder="输入您的密码" required>
                </div>

                <button type="submit" class="btn" style="width: 100%; padding: 0.75rem; font-size: 16px; margin-top: 16px;">
                    登录
                </button>
            </form>

            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                <p style="color: var(--secondary-color); margin-bottom: 16px; font-size: 14px;">还没有账户？</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <a href="/register" class="btn">创建账户</a>
                    <a href="/" class="btn btn-secondary">← 返回首页</a>
                </div>
            </div>
        </div>
    </div>
</div>

${generateFooter()}
`;

  const scripts = generateAuthScript() + `
<script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';

        try {
            const response = await fetch('/api/v1/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user info
                localStorage.setItem('accessToken', data.accessToken || data.token);
                localStorage.setItem('username', username);

                // Show success message
                submitBtn.textContent = '✓ 成功！';
                submitBtn.style.backgroundColor = '#28a745';

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                alert('登录失败: ' + (data.message || data.error || '未知错误'));
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            alert('登录失败: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
</script>
`;

  return generatePage({
    title: '登录',
    bodyContent,
    scripts,
    siteTitle: siteSettings.site_title
  });
}
