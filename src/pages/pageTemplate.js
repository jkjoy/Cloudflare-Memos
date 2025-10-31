import { getBroadcastStyles } from '../styles/broadcastInline.js';

/**
 * 获取网站设置
 * @param {Object} env - 环境变量
 * @returns {Object} 设置对象
 */
export async function getSiteSettings(env) {
  try {
    const db = env.DB;
    const stmt = db.prepare(`
      SELECT key, value
      FROM settings
      WHERE key IN ('site_title', 'site_avatar', 'allow_registration')
    `);
    const { results } = await stmt.all();

    const settings = {
      site_title: 'Memos',
      site_avatar: '',
      allow_registration: 'true'
    };

    results.forEach(row => {
      settings[row.key] = row.value;
    });

    return settings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return {
      site_title: 'Memos',
      site_avatar: '',
      allow_registration: 'true'
    };
  }
}

/**
 * 生成通用的 HTML 页面模板
 * @param {Object} options - 页面选项
 * @param {string} options.title - 页面标题
 * @param {string} options.bodyContent - 页面主体内容
 * @param {string} options.scripts - 页面脚本
 * @param {string} options.siteTitle - 网站标题（可选）
 * @returns {string} HTML 页面
 */
export function generatePage({ title, bodyContent, scripts = '', siteTitle = 'Memos' }) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${siteTitle}</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>${getBroadcastStyles()}</style>
</head>
<body>
    ${bodyContent}
    ${scripts}
</body>
</html>
`;
}

/**
 * 生成通用的页头（Broadcast 风格）
 * @param {string} title - 网站标题
 * @returns {string} 页头 HTML
 */
export function generateHeader(title = 'Memos') {
  return `
<div class="header">
    <img id="headerAvatar" src="https://www.gravatar.com/avatar/default?s=40&d=identicon" alt="avatar" class="header-avatar">
    <a href="/" class="header-title" id="headerTitle">${title}</a>
</div>
`;
}

/**
 * 生成侧边栏导航
 * @param {string} currentPage - 当前页面路径（如 '/', '/profile', '/search'等）
 * @returns {string} 导航 HTML
 */
export function generateNav(currentPage = '/') {
  return `
<div class="nav">
    <div class="nav-item" id="guestNav">
        <a href="/login" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            登录
        </a>
    </div>
    <div class="nav-item" id="guestNav2">
        <a href="/register" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            注册
        </a>
    </div>
    <div class="nav-item" id="userNav" style="display: none;">
        <a href="/" class="nav-link${currentPage === '/' ? ' current' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            首页
        </a>
    </div>
    <div class="nav-item">
        <a href="/explore" class="nav-link${currentPage === '/explore' ? ' current' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            广场
        </a>
    </div>
    <div class="nav-item" id="userNav2" style="display: none;">
        <a href="/profile" class="nav-link${currentPage === '/profile' ? ' current' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            资料
        </a>
    </div>
    <div class="nav-item" id="adminNav" style="display: none;">
        <a href="/settings" class="nav-link${currentPage === '/settings' ? ' current' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6"></path>
                <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"></path>
                <path d="M1 12h6m6 0h6"></path>
                <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"></path>
            </svg>
            设置
        </a>
    </div>
    <div class="nav-item" id="userNav3" style="display: none;">
        <a href="#" class="nav-link" onclick="showLogoutConfirm(); return false;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            退出
        </a>
    </div>
    <div class="nav-item" style="margin-top: 20px;">
        <span id="welcomeText" style="color: var(--secondary-color); font-size: 14px; padding: 5px 10px;"></span>
    </div>
    <div class="nav-item" style="margin-top: 12px; display: flex; gap: 12px; padding: 5px 10px;">
        <a href="/rss.xml" title="RSS订阅" style="color: var(--secondary-color); text-decoration: none; transition: color 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11a9 9 0 0 1 9 9"></path>
                <path d="M4 4a16 16 0 0 1 16 16"></path>
                <circle cx="5" cy="19" r="1"></circle>
            </svg>
        </a>
        <a href="/search" title="搜索" style="color: var(--secondary-color); text-decoration: none; transition: color 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
        </a>
    </div>
</div>
`;
}

/**
 * 生成通用的页脚
 * @returns {string} 页脚 HTML
 */
export function generateFooter() {
  return `
<div class="footer">
    <p>Powered by Cloudflare Workers & D1</p>
</div>
`;
}

/**
 * 生成通用的认证脚本
 * @returns {string} 认证相关的 JavaScript
 */
export function generateAuthScript() {
  return `
<script>
    // 显示确认模态框
    function showConfirmModal(title, message, onConfirm) {
        // 移除已存在的确认模态框
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建新的确认模态框
        const modal = document.createElement('div');
        modal.id = 'confirmModal';
        modal.style.cssText = 'display: flex; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(61, 61, 61, 0.8); align-items: center; justify-content: center;';

        modal.innerHTML = \`
            <div style="background-color: var(--cell-background-color); padding: 24px; border-radius: var(--box-border-radius); width: 90%; max-width: 400px; text-align: center; box-shadow: var(--shadows); border: 1px solid var(--border-color);">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3 style="color: var(--foreground-color); margin-bottom: 12px; font-size: 20px;">\${title}</h3>
                <p style="color: var(--secondary-color); margin-bottom: 24px; font-size: 14px;">\${message}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn" style="flex: 1; max-width: 120px; background-color: #dc3545; border-color: #dc3545;" onclick="confirmModalAction()">确定</button>
                    <button class="btn btn-secondary" style="flex: 1; max-width: 120px;" onclick="closeConfirmModal()">取消</button>
                </div>
            </div>
        \`;

        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeConfirmModal();
            }
        });

        // 设置确认回调
        window.confirmModalCallback = onConfirm;
    }

    function closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.remove();
        }
        window.confirmModalCallback = null;
    }

    function confirmModalAction() {
        if (window.confirmModalCallback) {
            window.confirmModalCallback();
        }
        closeConfirmModal();
    }

    // ESC键关闭确认框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeConfirmModal();
        }
    });

    // 显示退出登录确认
    function showLogoutConfirm() {
        showConfirmModal(
            '退出',
            '确定要退出登录吗？',
            function() {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('username');
                localStorage.removeItem('memos_user');
                window.location.href = '/login';
            }
        );
    }

    window.showLogoutConfirm = showLogoutConfirm;

    // 加载网站设置
    async function loadSiteSettings() {
        try {
            const response = await fetch('/api/v1/settings/public');
            if (response.ok) {
                const settings = await response.json();

                // 更新网站标题
                if (settings.site_title) {
                    const headerTitle = document.getElementById('headerTitle');
                    if (headerTitle) {
                        headerTitle.textContent = settings.site_title;
                    }
                    // 更新页面标题 - 只在包含默认值时替换
                    const titleParts = document.title.split(' - ');
                    if (titleParts.length === 2) {
                        document.title = titleParts[0] + ' - ' + settings.site_title;
                    }
                }

                // 更新网站头像
                const headerAvatar = document.getElementById('headerAvatar');
                if (headerAvatar && settings.site_avatar) {
                    headerAvatar.src = settings.site_avatar;
                }
            }
        } catch (error) {
            console.error('Error loading site settings:', error);
        }
    }

    // 简单的 MD5 hash 函数（用于 Gravatar）
    function md5(string) {
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);
            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);
            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);
            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }
        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        }
        function ff(a, b, c, d, x, s, t) {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }
        function gg(a, b, c, d, x, s, t) {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }
        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
        }
        function md51(s) {
            var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
            for (i=64; i<=s.length; i+=64) {
                md5cycle(state, md5blk(s.substring(i-64, i)));
            }
            s = s.substring(i-64);
            var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
            for (i=0; i<s.length; i++)
                tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
            tail[i>>2] |= 0x80 << ((i%4) << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i=0; i<16; i++) tail[i] = 0;
            }
            tail[14] = n*8;
            md5cycle(state, tail);
            return state;
        }
        function md5blk(s) {
            var md5blks = [], i;
            for (i=0; i<64; i+=4) {
                md5blks[i>>2] = s.charCodeAt(i)
                    + (s.charCodeAt(i+1) << 8)
                    + (s.charCodeAt(i+2) << 16)
                    + (s.charCodeAt(i+3) << 24);
            }
            return md5blks;
        }
        var hex_chr = '0123456789abcdef'.split('');
        function rhex(n) {
            var s='', j=0;
            for(; j<4; j++)
                s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
                    + hex_chr[(n >> (j * 8)) & 0x0F];
            return s;
        }
        function hex(x) {
            for (var i=0; i<x.length; i++)
                x[i] = rhex(x[i]);
            return x.join('');
        }
        function add32(a, b) {
            return (a + b) & 0xFFFFFFFF;
        }
        return hex(md51(string));
    }

    // 检查登录状态
    async function checkLoginStatus() {
        const token = localStorage.getItem('accessToken');
        const guestNav = document.getElementById('guestNav');
        const guestNav2 = document.getElementById('guestNav2');
        const userNav = document.getElementById('userNav');
        const userNav2 = document.getElementById('userNav2');
        const userNav3 = document.getElementById('userNav3');
        const adminNav = document.getElementById('adminNav');

        if (token) {
            // 验证token
            try {
                const response = await fetch('/api/v1/user', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });

                if (response.ok) {
                    const users = await response.json();
                    const currentUsername = localStorage.getItem('username');
                    const currentUser = users.find(u => u.username === currentUsername);

                    if (currentUser) {
                        if (guestNav) guestNav.style.display = 'none';
                        if (guestNav2) guestNav2.style.display = 'none';
                        if (userNav) userNav.style.display = 'flex';
                        if (userNav2) userNav2.style.display = 'flex';
                        if (userNav3) userNav3.style.display = 'flex';

                        // 显示管理员菜单
                        if (adminNav && (currentUser.role === 'admin' || currentUser.is_admin)) {
                            adminNav.style.display = 'flex';
                        }

                        const welcomeText = document.getElementById('welcomeText');
                        if (welcomeText) {
                            welcomeText.textContent = '你好, ' + (currentUser.nickname || currentUser.username);
                        }

                        // 更新头像
                        const headerAvatar = document.getElementById('headerAvatar');
                        if (headerAvatar) {
                            if (currentUser.email) {
                                // 使用用户自己的 Gravatar
                                const hash = currentUser.email.trim().toLowerCase();
                                headerAvatar.src = 'https://gravatar.loli.net/avatar/' + md5(hash) + '?s=40&d=identicon';
                            }
                            // 如果没有用户邮箱，保留网站设置的头像
                        }

                        return true;
                    }
                }
            } catch (error) {
                console.error('Token validation error:', error);
            }
        }

        // 未登录状态
        if (guestNav) guestNav.style.display = 'flex';
        if (guestNav2) guestNav2.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
        if (userNav2) userNav2.style.display = 'none';
        if (userNav3) userNav3.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';
        return false;
    }

    // 退出登录函数（保留以供其他地方调用）
    function logout() {
        showLogoutConfirm();
    }

    // 页面加载时检查登录状态
    document.addEventListener('DOMContentLoaded', async function() {
        await loadSiteSettings();
        await checkLoginStatus();
    });
</script>
`;
}
