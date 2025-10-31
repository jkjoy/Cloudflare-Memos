import { generatePage, generateHeader, generateNav, generateFooter, generateAuthScript, getSiteSettings } from './pageTemplate.js';

/**
 * 生成注册页 HTML
 */
export async function getRegisterPageHTML(request, env) {
  // 获取网站设置
  const siteSettings = await getSiteSettings(env);

  // 检查注册是否开放
  let allowRegistration = true;
  try {
    const db = env.DB;
    const stmt = db.prepare("SELECT value FROM settings WHERE key = 'allow_registration'");
    const setting = await stmt.first();
    if (setting && setting.value === 'false') {
      allowRegistration = false;
    }
  } catch (error) {
    console.error('Error checking registration setting:', error);
  }

  // 如果注册已关闭，显示提示页面
  if (!allowRegistration) {
    const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader()}
        ${generateNav()}
    </div>

    <div class="main-container">
        <div class="empty-state">
            <h3>注册已关闭</h3>
            <p>管理员已关闭新用户注册功能</p>
            <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
                <a href="/login" class="btn">前往登录</a>
                <a href="/" class="btn btn-secondary">返回首页</a>
            </div>
        </div>
    </div>
</div>

${generateFooter()}
`;

    return generatePage({
      title: '注册已关闭',
      bodyContent,
      scripts: generateAuthScript(),
      siteTitle: siteSettings.site_title
    });
  }

  const bodyContent = `
<div class="container">
    <div class="aside-container">
        ${generateHeader(siteSettings.site_title)}
        ${generateNav()}
    </div>

    <div class="main-container">
        <!-- Register Card -->
        <div style="background-color: var(--cell-background-color); border-radius: var(--box-border-radius); box-shadow: var(--shadows); border: 1px solid var(--border-color); padding: 32px; max-width: 480px; margin: 40px auto;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
                <h2 style="color: var(--highlight-color); margin-bottom: 8px; font-size: 24px;">创建账户</h2>
                <p style="color: var(--secondary-color); font-size: 14px;">加入我们，开始记录您的备忘录</p>
            </div>

            <form id="registerForm">
                <div class="form-group">
                    <label class="form-label" for="username">用户名</label>
                    <input type="text" id="username" name="username" class="form-input" placeholder="选择一个用户名" required minlength="3" autofocus>
                    <small style="color: var(--secondary-color); font-size: 12px; margin-top: 4px; display: block;">至少 3 个字符</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="nickname">昵称</label>
                    <input type="text" id="nickname" name="nickname" class="form-input" placeholder="您的显示名称" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">密码</label>
                    <input type="password" id="password" name="password" class="form-input" placeholder="创建一个密码" required minlength="6">
                    <small style="color: var(--secondary-color); font-size: 12px; margin-top: 4px; display: block;">至少 6 个字符</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="confirmPassword">确认密码</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" class="form-input" placeholder="再次输入密码" required>
                </div>

                <button type="submit" class="btn" style="width: 100%; padding: 0.75rem; font-size: 16px; margin-top: 16px;">
                    创建账户
                </button>
            </form>

            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                <p style="color: var(--secondary-color); margin-bottom: 16px; font-size: 14px;">已有账户？</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <a href="/login" class="btn">登录</a>
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
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const nickname = document.getElementById('nickname').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Validate password match
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致！');
            return;
        }

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = '创建账户中...';

        try {
            const response = await fetch('/api/v1/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, nickname, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                submitBtn.textContent = '✓ 成功！';
                submitBtn.style.backgroundColor = '#28a745';

                // Show alert and redirect
                alert('注册成功！请登录。');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
            } else {
                alert('注册失败: ' + (data.message || data.error || '未知错误'));
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            alert('注册失败: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
</script>
`;

  return generatePage({
    title: '注册',
    bodyContent,
    scripts,
    siteTitle: siteSettings.site_title
  });
}
