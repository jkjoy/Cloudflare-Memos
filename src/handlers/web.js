export async function handleWebRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path === '/') {
    return new Response(await getMemoListHTML(request), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (path === '/login') {
    return new Response(await getLoginHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (path === '/register') {
    return new Response(await getRegisterHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (path === '/profile') {
    return new Response(await getProfileHTML(request), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // 用户个人页面路由：/user/:id
  if (path.startsWith('/user/')) {
    const userId = path.split('/')[2];
    if (userId && /^\d+$/.test(userId)) {
      return new Response(await getUserPageHTML(request, userId), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }
  
  if (path.startsWith('/m/')) {
    const memoId = path.split('/')[2];
    if (memoId && /^\d+$/.test(memoId)) {
      return new Response(await getMemoDetailHTML(request, memoId), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    // 非法或缺失的ID，返回404
    return new Response(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>未找到备忘录</title></head><body><div style="padding:20px;text-align:center;"><h1>未找到备忘录</h1><p>请求的备忘录ID无效。</p><a href="/">返回首页</a></div></body></html>`, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), { 
    status: 404, 
    headers: { 'Content-Type': 'application/json; charset=utf-8' } 
  });
}


// 正确的MD5哈希实现（用于Gravatar）
function simpleMD5(str) {
  // 完整的MD5实现
  function safeAdd(x, y) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function md5ff(a, b, c, d, x, s, t) {
    return md5cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function md5gg(a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let i;
    let olda;
    let oldb;
    let oldc;
    let oldd;
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (i = 0; i < x.length; i += 16) {
      olda = a;
      oldb = b;
      oldc = c;
      oldd = d;

      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  function binl2hex(binarray) {
    const hexTab = '0123456789abcdef';
    let str = '';
    for (let i = 0; i < binarray.length * 4; i++) {
      str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
             hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
    }
    return str;
  }

  function str2binl(str) {
    const bin = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
    }
    return bin;
  }

  // UTF-8编码
  function utf8Encode(str) {
    return unescape(encodeURIComponent(str));
  }

  const utf8String = utf8Encode(str);
  return binl2hex(binlMD5(str2binl(utf8String), utf8String.length * 8));
}

// Gravatar头像生成函数
function getGravatarUrl(email, size = 40, request = null) {
  if (!email) {
    // 如果没有邮箱，使用默认头像
    const gravatarCdn = request?.env?.GRAVATAR_CDN || 'https://www.gravatar.com';
    return `${gravatarCdn}/avatar/default?s=${size}&d=identicon`;
  }
  
  const emailLower = email.toLowerCase().trim();
  const hash = simpleMD5(emailLower);
  
  // 优先使用环境变量中的CDN代理，支持国内访问
  const gravatarCdn = request?.env?.GRAVATAR_CDN || 'https://www.gravatar.com';
  
  return `${gravatarCdn}/avatar/${hash}?s=${size}&d=identicon`;
}

async function getMemoListHTML(request) {
  try {
    // 直接访问数据库获取memo数据，包含邮箱用于头像生成
    const db = request.env.DB;
    
    const limit = 20;
    const offset = 0;
    
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
      
      // 直接使用R2真实地址
      memo.resourceList = resources.map(resource => ({
        ...resource,
        filepath: resource.filepath // 使用数据库中的R2地址
      })) || [];
      
      memo.pinned = Boolean(memo.pinned);
    }
    
    // 在模板字符串之前预处理memo列表HTML
    let memoListHTML = '';
    if (Array.isArray(memos) && memos.length > 0) {
      memoListHTML = memos.map(memo => {
        const resourcesHTML = memo.resourceList && memo.resourceList.length > 0 ? 
          '<div class="memo-resources">' +
            memo.resourceList.map(resource => 
              '<a href="' + resource.filepath + '" class="resource-item" target="_blank">' +
                '📎 ' + resource.filename +
              '</a>'
            ).join('') +
          '</div>' : '';
        
        return '<div class="memo-item ' + (memo.pinned ? 'pinned' : '') + '">' +
          '<div class="memo-header">' +
            '<div class="memo-author">' +
              '<a href="/user/' + memo.creatorId + '" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">' +
                '<img src="' + getGravatarUrl(memo.creatorEmail, 32, request) + '" alt="头像" class="avatar">' +
                '<div class="author-info">' +
                  '<div class="author-name">' + (memo.creatorName || memo.creatorUsername || '匿名') + '</div>' +
                  '<div class="author-username">@' + memo.creatorUsername + '</div>' +
                '</div>' +
              '</a>' +
              (memo.pinned ? '<span style="color: #ff9800; margin-left: 8px;">📌</span>' : '') +
            '</div>' +
            '<div class="memo-time">' +
              new Date(memo.createdTs * 1000).toLocaleString('zh-CN') +
            '</div>' +
          '</div>' +
          '<div class="memo-content">' + memo.content + '</div>' +
          resourcesHTML +
          '<div class="memo-actions">' +
            '<a href="/m/' + memo.id + '" class="btn">查看详情</a>' +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      memoListHTML = '<div class="empty-state">' +
        '<h3>暂无备忘录</h3>' +
        '<p>快来创建你的第一条备忘录吧！</p>' +
      '</div>';
    }
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memos - 备忘录列表</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .memo-list {
            space-y: 20px;
        }
        
        .memo-item {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        
        .memo-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .memo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .memo-author {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .author-info {
            display: flex;
            flex-direction: column;
        }
        
        .author-name {
            font-weight: 500;
            color: #2c3e50;
            font-size: 14px;
        }
        
        .author-username {
            font-size: 12px;
            color: #999;
        }
        
        .memo-time {
            color: #999;
        }
        
        .memo-content {
            margin-bottom: 15px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .memo-resources {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .resource-item {
            display: inline-block;
            padding: 5px 10px;
            background: #e3f2fd;
            border-radius: 4px;
            text-decoration: none;
            color: #1976d2;
            font-size: 14px;
        }
        
        .resource-item:hover {
            background: #bbdefb;
        }
        
        .memo-actions {
            text-align: right;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
        
        .btn {
            display: inline-block;
            padding: 8px 16px;
            margin-left: 10px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .btn:hover {
            background: #0056b3;
        }
        
        .pinned {
            border-left: 4px solid #ff9800;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 8px;
            color: #666;
        }
        
        .create-form {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: none; /* 默认隐藏 */
        }
        
        .create-form.show {
            display: block; /* 登录后显示 */
        }
        
        .login-prompt {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
            color: #6c757d;
        }
        
        .login-prompt.hide {
            display: none;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-group textarea {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .file-upload-area {
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            background: #fafafa;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .file-upload-area:hover {
            border-color: #667eea;
            background: #f0f4ff;
        }
        
        .file-upload-area.dragover {
            border-color: #667eea;
            background: #e8f2ff;
        }
        
        .upload-icon {
            font-size: 48px;
            color: #ccc;
            margin-bottom: 10px;
        }
        
        .upload-text {
            color: #666;
            margin-bottom: 10px;
        }
        
        .file-input {
            display: none;
        }
        
        .file-preview {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .preview-item {
            position: relative;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }
        
        .preview-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            background: #f5f5f5;
        }
        
        .preview-info {
            padding: 8px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
        }
        
        .preview-name {
            font-weight: 500;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .preview-size {
            color: #999;
        }
        
        .remove-file {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(220, 53, 69, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .remove-file:hover {
            background: rgba(220, 53, 69, 1);
        }
        
        .upload-progress {
            margin-top: 10px;
            display: none;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: #667eea;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .memo-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .memo-actions {
                text-align: left;
            }
        }
        
        /* 首页模态弹窗样式 */
        .message-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .message-modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .message-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .message-icon.success {
            color: #28a745;
        }
        
        .message-icon.error {
            color: #dc3545;
        }
        
        .message-icon.info {
            color: #007bff;
        }
        
        .message-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .message-text {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .message-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-ok {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-ok:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Memos</h1>
            <p>轻量级备忘录系统</p>
            <div style="margin-top: 15px;" id="navLinks">
                <div id="guestNav">
                    <a href="/login" style="margin-right: 10px; padding: 5px 15px; background: #667eea; color: white; text-decoration: none; border-radius: 4px;">🔑 登录</a>
                    <a href="/register" style="padding: 5px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 4px;">👤 注册</a>
                </div>
                <div id="userNav" style="display: none;">
                    <span id="welcomeText" style="margin-right: 15px; color: #666;"></span>
                    <a href="/profile" style="margin-right: 10px; padding: 5px 15px; background: #6c757d; color: white; text-decoration: none; border-radius: 4px;">⚙️ 个人资料</a>
                    <button onclick="logout()" style="padding: 5px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">🚪 退出登录</button>
                </div>
            </div>
        </div>
        
        <div class="login-prompt" id="loginPrompt">
            <h3>🔑 请先登录</h3>
            <p>需要登录后才能创建备忘录</p>
            <a href="/login" class="btn" style="margin-top: 10px;">立即登录</a>
        </div>
        
        <div class="create-form" id="createForm">
            <h3>创建新备忘录</h3>
            <form id="createMemoForm">
                <div class="form-group">
                    <label for="content">内容</label>
                    <textarea id="content" name="content" placeholder="输入备忘录内容..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>📎 上传图片/附件</label>
                    <div class="file-upload-area" id="fileUploadArea">
                        <div class="upload-icon">📷</div>
                        <div class="upload-text">点击选择文件或拖拽到这里</div>
                        <div style="font-size: 12px; color: #999;">支持图片、文档等多种文件格式</div>
                    </div>
                    <input type="file" id="fileInput" class="file-input" multiple accept="image/*,application/pdf,.doc,.docx,.txt">
                    
                    <div class="upload-progress" id="uploadProgress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #666;" id="progressText">上传中...</div>
                    </div>
                    
                    <div class="file-preview" id="filePreview"></div>
                </div>
                
                <button type="submit" class="btn">创建备忘录</button>
            </form>
        </div>
        
        <div class="memo-list">
            ${memoListHTML}
        </div>
    </div>
    
    <!-- 消息模态弹窗 -->
    <div class="message-modal" id="messageModal">
        <div class="message-modal-content">
            <div class="message-icon" id="messageIcon">ℹ️</div>
            <div class="message-title" id="messageTitle">提示</div>
            <div class="message-text" id="messageText">消息内容</div>
            <div class="message-buttons">
                <button class="btn-ok" onclick="hideMessage()">确定</button>
            </div>
        </div>
    </div>
    
    <script>
        // 模态弹窗相关函数
        function showMessage(type, title, text, callback) {
            const modal = document.getElementById('messageModal');
            if (!modal) {
                console.error('Modal element not found');
                return;
            }
            
            const icon = document.getElementById('messageIcon');
            const titleEl = document.getElementById('messageTitle');
            const textEl = document.getElementById('messageText');
            
            // 设置图标和样式
            icon.className = 'message-icon ' + type;
            switch(type) {
                case 'success':
                    icon.textContent = '✓';
                    break;
                case 'error':
                    icon.textContent = '⚠️';
                    break;
                case 'info':
                default:
                    icon.textContent = 'ℹ️';
                    break;
            }
            
            titleEl.textContent = title;
            textEl.innerHTML = text;
            modal.style.display = 'block';
            
            // 存储回调函数
            modal.callback = callback;
        }
        
        function hideMessage() {
            const modal = document.getElementById('messageModal');
            if (!modal) return;
            
            modal.style.display = 'none';
            
            // 执行回调函数
            if (modal.callback) {
                modal.callback();
                modal.callback = null;
            }
        }
        
        // 点击外部区域关闭模态弹窗
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
        
        // 检查登录状态
        function checkLoginStatus() {
            const userData = localStorage.getItem('memos_user');
            const sessionData = localStorage.getItem('memos_session');
            
            console.log('检查登录状态:', {
                hasUserData: !!userData,
                hasSessionData: !!sessionData,
                userData: userData,
                sessionData: sessionData
            });
            
            if (userData && sessionData) {
                try {
                    // 已登录，显示创建表单和用户导航
                    const user = JSON.parse(userData);
                    console.log('登录用户信息:', user);
                    
                    document.getElementById('loginPrompt').style.display = 'none';
                    document.getElementById('createForm').classList.add('show');
                    document.getElementById('guestNav').style.display = 'none';
                    document.getElementById('userNav').style.display = 'block';
                    document.getElementById('welcomeText').textContent = '欢迎，' + user.nickname;
                    
                    return true;
                } catch (error) {
                    console.error('解析用户数据出错:', error);
                    // 数据损坏，清理localStorage
                    localStorage.removeItem('memos_user');
                    localStorage.removeItem('memos_session');
                }
            }
            
            console.log('未登录状态，显示登录提示');
            // 未登录，显示登录提示和访客导航
            document.getElementById('loginPrompt').style.display = 'block';
            document.getElementById('createForm').classList.remove('show');
            document.getElementById('guestNav').style.display = 'block';
            document.getElementById('userNav').style.display = 'none';
            return false;
        }
        
        // 退出登录
        function logout() {
            localStorage.removeItem('memos_user');
            localStorage.removeItem('memos_session');
            showMessage('success', '退出成功', '您已成功退出登录', function() {
                location.reload();
            });
        }
        
        // 文件上传相关变量
        let selectedFiles = [];
        let uploadedResources = [];
        
        // 文件上传区域事件
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');
        const filePreview = document.getElementById('filePreview');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });
        
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });
        
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            handleFileSelection(files);
        });
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFileSelection(files);
        });
        
        // 处理文件选择
        function handleFileSelection(files) {
            files.forEach(file => {
                if (file.size > 10 * 1024 * 1024) { // 10MB 限制
                    showMessage('error', '文件过大', '文件 "' + file.name + '" 超过 10MB 限制');
                    return;
                }
                
                selectedFiles.push(file);
                displayFilePreview(file);
            });
        }
        
        // 显示文件预览
        function displayFilePreview(file) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.dataset.fileName = file.name;
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewItem.innerHTML = 
                        '<img src="' + e.target.result + '" alt="预览" class="preview-image">' +
                        '<div class="preview-info">' +
                            '<div class="preview-name">' + file.name + '</div>' +
                            '<div class="preview-size">' + formatFileSize(file.size) + '</div>' +
                        '</div>' +
                        '<button type="button" class="remove-file" onclick="removeFile(' + JSON.stringify(file.name) + ')">×</button>';
                };
                reader.readAsDataURL(file);
            } else {
                // 非图片文件显示文件图标
                const fileIcon = getFileIcon(file.type);
                previewItem.innerHTML = 
                    '<div class="preview-image" style="display: flex; align-items: center; justify-content: center; font-size: 48px; color: #ccc;">' +
                        fileIcon +
                    '</div>' +
                    '<div class="preview-info">' +
                        '<div class="preview-name">' + file.name + '</div>' +
                        '<div class="preview-size">' + formatFileSize(file.size) + '</div>' +
                    '</div>' +
                    '<button type="button" class="remove-file" onclick="removeFile(' + JSON.stringify(file.name) + ')">×</button>';
            }
            
            filePreview.appendChild(previewItem);
        }
        
        // 移除文件
        function removeFile(fileName) {
            selectedFiles = selectedFiles.filter(file => file.name !== fileName);
            // 修复选择器，使用正确的data属性名
            const previewItem = document.querySelector('[data-file-name="' + fileName + '"]');
            if (previewItem) {
                previewItem.remove();
            }
            // 同时更新文件输入框的显示
            const fileInput = document.getElementById('fileInput');
            if (fileInput && selectedFiles.length === 0) {
                fileInput.value = '';
            }
        }
        
        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // 获取文件图标
        function getFileIcon(mimeType) {
            if (mimeType.includes('pdf')) return '📄';
            if (mimeType.includes('word') || mimeType.includes('document')) return '📄';
            if (mimeType.includes('text')) return '📄';
            if (mimeType.includes('video')) return '🎥';
            if (mimeType.includes('audio')) return '🎧';
            return '📁';
        }
        
        // 上传文件
        async function uploadFiles() {
            if (selectedFiles.length === 0) return [];
            
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                throw new Error('请先登录');
            }
            
            const session = JSON.parse(sessionData);
            const uploadProgress = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            uploadProgress.style.display = 'block';
            
            const uploadedFiles = [];
            
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    const response = await fetch('/api/v1/resource/', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer session_' + session.userId
                        },
                        body: formData
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        uploadedFiles.push(result);
                        
                        // 更新进度
                        const progress = ((i + 1) / selectedFiles.length) * 100;
                        progressFill.style.width = progress + '%';
                        progressText.textContent = '上传中... ' + (i + 1) + '/' + selectedFiles.length;
                    } else {
                        console.error('文件上传失败:', file.name);
                    }
                } catch (error) {
                    console.error('文件上传错误:', error);
                }
            }
            
            uploadProgress.style.display = 'none';
            return uploadedFiles;
        }
        
        document.getElementById('createMemoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = document.getElementById('content').value;
            
            // 允许内容为空，但至少要有内容或附件
            if (!content.trim() && selectedFiles.length === 0) {
                showMessage('error', '错误', '请输入备忘录内容或上传附件');
                return;
            }
            
            // 检查登录状态
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            try {
                const session = JSON.parse(sessionData);
                
                // 先上传文件（如果有）
                let resourceIds = [];
                if (selectedFiles.length > 0) {
                    const uploadedFiles = await uploadFiles();
                    resourceIds = uploadedFiles.map(file => file.id);
                }
                
                // 创建备忘录
                const memoData = { content };
                if (resourceIds.length > 0) {
                    memoData.resourceIdList = resourceIds;
                }
                
                const response = await fetch('/api/v1/memo/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer session_' + session.userId
                    },
                    body: JSON.stringify(memoData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('success', '创建成功', '备忘录创建成功！', function() {
                        // 清空表单
                        document.getElementById('content').value = '';
                        selectedFiles = [];
                        filePreview.innerHTML = '';
                        location.reload();
                    });
                } else {
                    showMessage('error', '创建失败', result.error || result.message || '未知错误');
                }
            } catch (error) {
                showMessage('error', '创建失败', error.message);
            }
        });
        
        // 页面加载时检查登录状态
        window.addEventListener('load', function() {
            // 延迟检查以确保localStorage数据已完全保存
            setTimeout(() => {
                checkLoginStatus();
            }, 100);
        });
        
        // 如果页面已经加载完成，立即检查
        if (document.readyState === 'complete') {
            setTimeout(() => {
                checkLoginStatus();
            }, 100);
        }
        
        // 将函数暴露到全局作用域
        window.removeFile = removeFile;
    </script>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating memo list HTML:', error);
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Memos - 错误</title>
</head>
<body>
    <div style="padding: 20px; text-align: center;">
        <h1>加载失败</h1>
        <p>无法加载备忘录列表：${error.message}</p>
        <a href="/">重试</a>
    </div>
</body>
</html>`;
  }
}

async function getLoginHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - Memos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .login-btn {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .login-btn:hover {
            background: #5a6fd8;
        }
        
        .register-link {
            margin-top: 20px;
            color: #666;
        }
        
        .register-link a {
            color: #667eea;
            text-decoration: none;
        }
        
        .register-link a:hover {
            text-decoration: underline;
        }
        
        .back-link {
            margin-top: 15px;
        }
        
        .back-link a {
            color: #888;
            text-decoration: none;
            font-size: 14px;
        }
        
        /* 登录页面模态弹窗样式 */
        .message-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .message-modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .message-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .message-icon.success {
            color: #28a745;
        }
        
        .message-icon.error {
            color: #dc3545;
        }
        
        .message-icon.info {
            color: #007bff;
        }
        
        .message-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .message-text {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .message-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-ok {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-ok:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">📝 Memos</div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" placeholder="请输入密码" required>
            </div>
            
            <button type="submit" class="login-btn">登录</button>
        </form>
        
        <div class="register-link">
            还没有账号？<a href="/register">点击注册</a>
        </div>
        
        <div class="back-link">
            <a href="/">← 返回首页</a>
        </div>
    </div>
    
    <!-- 消息模态弹窗 -->
    <div class="message-modal" id="messageModal">
        <div class="message-modal-content">
            <div class="message-icon" id="messageIcon">ℹ️</div>
            <div class="message-title" id="messageTitle">提示</div>
            <div class="message-text" id="messageText">消息内容</div>
            <div class="message-buttons">
                <button class="btn-ok" onclick="hideMessage()">确定</button>
            </div>
        </div>
    </div>
    
    <script>
        // 模态弹窗相关函数
        function showMessage(type, title, text, callback) {
            const modal = document.getElementById('messageModal');
            const icon = document.getElementById('messageIcon');
            const titleEl = document.getElementById('messageTitle');
            const textEl = document.getElementById('messageText');
            
            // 设置图标和样式
            icon.className = 'message-icon ' + type;
            switch(type) {
                case 'success':
                    icon.textContent = '✓';
                    break;
                case 'error':
                    icon.textContent = '⚠️';
                    break;
                case 'info':
                default:
                    icon.textContent = 'ℹ️';
                    break;
            }
            
            titleEl.textContent = title;
            textEl.innerHTML = text;
            modal.style.display = 'block';
            
            // 存储回调函数
            modal.callback = callback;
        }
        
        function hideMessage() {
            const modal = document.getElementById('messageModal');
            modal.style.display = 'none';
            
            // 执行回调函数
            if (modal.callback) {
                modal.callback();
                modal.callback = null;
            }
        }
        
        // 点击外部区域关闭模态弹窗
        document.getElementById('messageModal').addEventListener('click', function(e) {
            if (e.target === this) {
                hideMessage();
            }
        });
        
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                showMessage('error', '错误', '请填写完整的登录信息');
                return;
            }
            
            try {
                const response = await fetch('/api/v1/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    // 保存用户信息到本地存储
                    localStorage.setItem('memos_user', JSON.stringify(result.user));
                    localStorage.setItem('memos_session', JSON.stringify(result.session));
                    
                    showMessage('success', '登录成功', '欢迎，' + result.user.nickname + '！', function() {
                        // 直接跳转到首页，避免重复刷新
                        window.location.replace('/');
                    });
                } else {
                    showMessage('error', '登录失败', result.error || result.message || '未知错误');
                }
            } catch (error) {
                showMessage('error', '登录失败', error.message);
            }
        });
    </script>
</body>
</html>`;
}

async function getRegisterHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>注册 - Memos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .register-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .register-btn {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .register-btn:hover {
            background: #5a6fd8;
        }
        
        .login-link {
            margin-top: 20px;
            color: #666;
        }
        
        .login-link a {
            color: #667eea;
            text-decoration: none;
        }
        
        .login-link a:hover {
            text-decoration: underline;
        }
        
        .back-link {
            margin-top: 15px;
        }
        
        .back-link a {
            color: #888;
            text-decoration: none;
            font-size: 14px;
        }
        
        /* 注册页面模态弹窗样式 */
        .message-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .message-modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .message-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .message-icon.success {
            color: #28a745;
        }
        
        .message-icon.error {
            color: #dc3545;
        }
        
        .message-icon.info {
            color: #007bff;
        }
        
        .message-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .message-text {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .message-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-ok {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-ok:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="register-container">
        <div class="logo">📝 Memos 注册</div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" name="username" placeholder="请输入用户名" required>
            </div>
            
            <div class="form-group">
                <label for="nickname">昵称</label>
                <input type="text" id="nickname" name="nickname" placeholder="请输入您的昵称（支持中文）" required>
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" placeholder="请设置密码（至少6位）" required>
            </div>
            
            <div class="form-group">
                <label for="email">邮箱（可选）</label>
                <input type="email" id="email" name="email" placeholder="请输入邮箱地址">
            </div>
            
            <button type="submit" class="register-btn">注册</button>
        </form>
        
        <div class="login-link">
            已有账号？<a href="/login">立即登录</a>
        </div>
        
        <div class="back-link">
            <a href="/">← 返回首页</a>
        </div>
    </div>
    
    <!-- 消息模态弹窗 -->
    <div class="message-modal" id="messageModal">
        <div class="message-modal-content">
            <div class="message-icon" id="messageIcon">ℹ️</div>
            <div class="message-title" id="messageTitle">提示</div>
            <div class="message-text" id="messageText">消息内容</div>
            <div class="message-buttons">
                <button class="btn-ok" onclick="hideMessage()">确定</button>
            </div>
        </div>
    </div>
    
    <script>
        // 确保页面完全加载后再执行
        document.addEventListener('DOMContentLoaded', function() {
            // 模态弹窗相关函数
            window.showMessage = function(type, title, text, callback) {
                const modal = document.getElementById('messageModal');
                if (!modal) {
                    console.error('Modal element not found');
                    return;
                }
                
                const icon = document.getElementById('messageIcon');
                const titleEl = document.getElementById('messageTitle');
                const textEl = document.getElementById('messageText');
                
                // 设置图标和样式
                icon.className = 'message-icon ' + type;
                switch(type) {
                    case 'success':
                        icon.textContent = '✓';
                        break;
                    case 'error':
                        icon.textContent = '⚠️';
                        break;
                    case 'info':
                    default:
                        icon.textContent = 'ℹ️';
                        break;
                }
                
                titleEl.textContent = title;
                textEl.innerHTML = text;
                modal.style.display = 'block';
                
                // 存储回调函数
                modal.callback = callback;
            };
            
            window.hideMessage = function() {
                const modal = document.getElementById('messageModal');
                if (!modal) return;
                
                modal.style.display = 'none';
                
                // 执行回调函数
                if (modal.callback) {
                    modal.callback();
                    modal.callback = null;
                }
            };
            
            // 点击外部区域关闭模态弹窗
            const messageModal = document.getElementById('messageModal');
            if (messageModal) {
                messageModal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        window.hideMessage();
                    }
                });
            }
            
            // 注册表单提交处理
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const username = document.getElementById('username').value;
                    const nickname = document.getElementById('nickname').value;
                    const password = document.getElementById('password').value;
                    const email = document.getElementById('email').value;
                    
                    if (!username || !nickname || !password) {
                        window.showMessage('error', '错误', '请填写用户名、昵称和密码');
                        return;
                    }
                    
                    if (password.length < 6) {
                        window.showMessage('error', '错误', '密码至少需要6位');
                        return;
                    }
                    
                    try {
                        const response = await fetch('/api/v1/user', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                username: username,
                                nickname: nickname,
                                password: password,
                                email: email || null
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok) {
                            window.showMessage('success', '注册成功', result.message || '欢迎加入！', function() {
                                window.location.href = '/login';
                            });
                        } else {
                            window.showMessage('error', '注册失败', result.error || result.message || '未知错误');
                        }
                    } catch (error) {
                        window.showMessage('error', '注册失败', error.message);
                    }
                });
            }
        });
    </script>
</body>
</html>`;
}

async function getProfileHTML(request) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>个人资料 - Memos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
        }
        
        .profile-card {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        .form-group input[readonly] {
            background-color: #f8f9fa;
            color: #6c757d;
            cursor: not-allowed;
            border-color: #e9ecef;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .readonly-note {
            font-size: 12px;
            color: #6c757d;
            margin-top: 5px;
            font-style: italic;
        }
        
        .btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
        }
        
        .btn:hover {
            background: #5a6fd8;
        }
        
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        
        .back-link a {
            color: #667eea;
            text-decoration: none;
        }
        
        /* 个人资料页面模态弹窗样式 */
        .message-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .message-modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .message-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .message-icon.success {
            color: #28a745;
        }
        
        .message-icon.error {
            color: #dc3545;
        }
        
        .message-icon.info {
            color: #007bff;
        }
        
        .message-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .message-text {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .message-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-ok {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-ok:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="profile-card">
            <div class="header">
                <h1>👤 个人资料</h1>
            </div>
            
            <form id="profileForm">
                <div class="form-group">
                    <label for="userId">用户ID</label>
                    <input type="text" id="userId" readonly>
                    <div class="readonly-note">用户ID无法修改</div>
                </div>
                
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" readonly>
                    <div class="readonly-note">用户名无法修改</div>
                </div>
                
                <div class="form-group">
                    <label for="nickname">昵称 <span style="color: #28a745;">✓ 可修改</span></label>
                    <input type="text" id="nickname" name="nickname" placeholder="请输入您的昵称（支持中文）" required>
                </div>
                
                <div class="form-group">
                    <label for="email">邮箱 <span style="color: #28a745;">✓ 可修改</span></label>
                    <input type="email" id="email" name="email" placeholder="请输入邮箱地址（用于显示头像）">
                </div>
                
                <div class="form-section-divider" style="margin: 30px 0; border-top: 1px solid #eee; padding-top: 30px;">
                    <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 18px;">🔒 修改密码</h3>
                </div>
                
                <div class="form-group">
                    <label for="currentPassword">当前密码</label>
                    <input type="password" id="currentPassword" name="currentPassword" placeholder="请输入当前密码">
                </div>
                
                <div class="form-group">
                    <label for="newPassword">新密码</label>
                    <input type="password" id="newPassword" name="newPassword" placeholder="请输入新密码（至少6位）">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">确认新密码</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" placeholder="请再次输入新密码">
                </div>
                
                <button type="submit" class="btn">保存更改</button>
                <button type="button" class="btn" onclick="loadUserInfo()">刷新信息</button>
                <button type="button" class="btn" style="background: #dc3545; margin-left: 10px;" onclick="changePassword()">修改密码</button>
            </form>
            

            <div class="back-link">
                <a href="/">← 返回首页</a>
            </div>
        </div>
    </div>
    
    <!-- 消息模态弹窗 -->
    <div class="message-modal" id="messageModal">
        <div class="message-modal-content">
            <div class="message-icon" id="messageIcon">ℹ️</div>
            <div class="message-title" id="messageTitle">提示</div>
            <div class="message-text" id="messageText">消息内容</div>
            <div class="message-buttons">
                <button class="btn-ok" onclick="hideMessage()">确定</button>
            </div>
        </div>
    </div>
    
    <script>
        // 模态弹窗相关函数
        function showMessage(type, title, text, callback) {
            const modal = document.getElementById('messageModal');
            if (!modal) {
                console.error('Modal element not found');
                return;
            }
            
            const icon = document.getElementById('messageIcon');
            const titleEl = document.getElementById('messageTitle');
            const textEl = document.getElementById('messageText');
            
            // 设置图标和样式
            icon.className = 'message-icon ' + type;
            switch(type) {
                case 'success':
                    icon.textContent = '✓';
                    break;
                case 'error':
                    icon.textContent = '⚠️';
                    break;
                case 'info':
                default:
                    icon.textContent = 'ℹ️';
                    break;
            }
            
            titleEl.textContent = title;
            textEl.innerHTML = text;
            modal.style.display = 'block';
            
            // 存储回调函数
            modal.callback = callback;
        }
        
        function hideMessage() {
            const modal = document.getElementById('messageModal');
            if (!modal) return;
            
            modal.style.display = 'none';
            
            // 执行回调函数
            if (modal.callback) {
                modal.callback();
                modal.callback = null;
            }
        }
        
        // 点击外部区域关闭模态弹窗
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
            const userData = localStorage.getItem('memos_user');
            if (!userData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            try {
                const user = JSON.parse(userData);
                currentUserId = user.id;
                document.getElementById('userId').value = user.id;
                document.getElementById('username').value = user.username;
                document.getElementById('nickname').value = user.nickname;
                document.getElementById('email').value = user.email || '';
            } catch (error) {
                showMessage('error', '加载失败', '用户信息加载失败：' + error.message);
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
            
            // 检查登录状态并获取session token
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            if (!nickname) {
                showMessage('error', '错误', '请填写昵称');
                return;
            }
            
            try {
                const session = JSON.parse(sessionData);
                const sessionToken = 'session_' + session.userId;
                
                const response = await fetch('/api/v1/user/' + currentUserId, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: JSON.stringify({
                        nickname: nickname,
                        email: email || null
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('success', '更新成功', '个人资料更新成功！', function() {
                        // 更新本地存储的用户信息
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
        
        // 修改密码函数
        async function changePassword() {
            if (!currentUserId) {
                showMessage('error', '错误', '请先加载用户信息');
                return;
            }
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // 表单验证
            if (!currentPassword) {
                showMessage('error', '错误', '请输入当前密码');
                return;
            }
            
            if (!newPassword) {
                showMessage('error', '错误', '请输入新密码');
                return;
            }
            
            if (newPassword.length < 6) {
                showMessage('error', '错误', '新密码长度至少6位');
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
            
            // 检查登录状态并获取session token
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            try {
                const session = JSON.parse(sessionData);
                const sessionToken = 'session_' + session.userId;
                
                const response = await fetch('/api/v1/user/' + currentUserId + '/password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('success', '修改成功', '密码修改成功！', function() {
                        // 清空密码输入框
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
        
        // 将函数暴露到全局作用域
  
        window.changePassword = changePassword;
    </script>
</body>
</html>`;
}

async function getMemoDetailHTML(request, memoId) {
  try {
    // 获取单个memo数据
    const apiUrl = new URL(`/api/v1/memo/${memoId}`, request.url);
    const apiRequest = new Request(apiUrl, {
      headers: request.headers
    });
    apiRequest.env = request.env;
    
    const { handleMemoRoutes } = await import('./memos');
    const response = await handleMemoRoutes(apiRequest);
    
    if (!response.ok) {
      throw new Error('Memo not found');
    }
    
    const memo = await response.json();
    // 获取头像URL（不暴露邮箱给前端）
    let avatarUrl = getGravatarUrl(null, 40, request);
    try {
      const db = request.env.DB;
      if (memo && memo.creatorId && db) {
        const row = await db.prepare('SELECT email FROM users WHERE id = ?').bind(memo.creatorId).first();
        avatarUrl = getGravatarUrl(row?.email || null, 40, request);
      }
    } catch (_) {
      // 忽略头像加载失败，使用默认头像
    }
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memo #${memo.id} - ${memo.content.substring(0, 50)}...</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .back-btn {
            display: inline-block;
            padding: 10px 20px;
            background: #6c757d;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        
        .back-btn:hover {
            background: #545b62;
        }
        
        .memo-detail {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .memo-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #eee;
        }
        
        .memo-author {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
        }

        .author-info {
            display: flex;
            flex-direction: column;
        }

        .author-name {
            font-weight: 500;
            color: #2c3e50;
            font-size: 14px;
        }

        .author-username {
            font-size: 12px;
            color: #999;
        }
        
        .memo-time {
            color: #666;
            font-size: 14px;
        }
        
        .memo-content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 25px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .memo-resources {
            margin-top: 25px;
        }
        
        .memo-resources h4 {
            margin-bottom: 15px;
            color: #2c3e50;
        }
        
        .resource-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .resource-item {
            display: block;
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            text-decoration: none;
            color: #495057;
            transition: all 0.2s ease;
        }
        
        .resource-item:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        
        .resource-filename {
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .resource-type {
            font-size: 12px;
            color: #6c757d;
        }
        
        .memo-actions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
        }
        
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 0 5px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .btn:hover {
            background: #0056b3;
        }
        
        .btn-danger {
            background: #dc3545;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .edit-form {
            display: none;
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-group textarea {
            width: 100%;
            min-height: 120px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .delete-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .delete-modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .delete-icon {
            font-size: 48px;
            color: #dc3545;
            margin-bottom: 20px;
        }
        
        .delete-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .delete-message {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .delete-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-cancel {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-cancel:hover {
            background: #545b62;
        }
        
        .btn-confirm-delete {
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-confirm-delete:hover {
            background: #c82333;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header {
                flex-direction: column;
                gap: 15px;
            }
            
            .memo-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .resource-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* memo详情页面模态弹窗样式 */
        .message-modal {
            display: none;
            position: fixed;
            z-index: 1001;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .message-modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .message-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .message-icon.success {
            color: #28a745;
        }
        
        .message-icon.error {
            color: #dc3545;
        }
        
        .message-icon.info {
            color: #007bff;
        }
        
        .message-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .message-text {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .message-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-ok {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-ok:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Memo #${memo.id}</h1>
            <a href="/" class="back-btn">← 返回列表</a>
        </div>
        
        <div class="memo-detail">
            <div class="memo-meta">
                <div>
                    <div class="memo-author">
                        <img src="${avatarUrl}" alt="头像" class="avatar">
                        <div class="author-info">
                            <div class="author-name">${memo.creatorName || memo.creatorUsername || '匿名'}</div>
                            <div class="author-username">@${memo.creatorUsername || 'user'}</div>
                        </div>
                        ${memo.pinned ? '<span style="color: #ff9800;">📌</span>' : ''}
                    </div>
                </div>
                <div class="memo-time">
                    创建于: ${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}<br>
                    ${memo.updatedTs !== memo.createdTs ? `更新于: ${new Date(memo.updatedTs * 1000).toLocaleString('zh-CN')}` : ''}
                </div>
            </div>
            
            <div class="memo-content" id="memoContent">${memo.content}</div>
            
            ${memo.resourceList && memo.resourceList.length > 0 ? `
                <div class="memo-resources">
                    <h4>📎 附件资源</h4>
                    <div class="resource-grid">
                        ${memo.resourceList.map(resource => `
                            <a href="${resource.externalLink || resource.filepath}" class="resource-item" target="_blank">
                                <div class="resource-filename">${resource.filename}</div>
                                <div class="resource-type">${resource.type || '未知类型'} ${resource.size ? `(${(resource.size / 1024).toFixed(1)} KB)` : ''}</div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="memo-actions" id="memoActions">
                <div id="guestActions" style="display: none;">
                    <p style="color: #666; margin-bottom: 15px;">请登录后编辑此备忘录</p>
                    <a href="/login" class="btn">🔑 登录</a>
                </div>
                <div id="userActions" style="display: none;">
                    <button class="btn" onclick="toggleEditForm()">编辑</button>
                    <button class="btn btn-danger" onclick="showDeleteConfirm()">删除</button>
                </div>
                <div id="noPermissionActions" style="display: none;">
                    <p style="color: #999; font-style: italic;">只有创建者或管理员才能编辑此备忘录</p>
                </div>
            </div>
            
            <div class="edit-form" id="editForm">
                <h4>编辑备忘录</h4>
                <form id="updateMemoForm">
                    <div class="form-group">
                        <label for="editContent">内容</label>
                        <textarea id="editContent" name="content" required>${memo.content}</textarea>
                    </div>
                    <button type="submit" class="btn">保存修改</button>
                    <button type="button" class="btn" onclick="toggleEditForm()">取消</button>
                </form>
            </div>
        </div>
        
        <!-- 消息模态弹窗 -->
        <div class="message-modal" id="messageModal">
            <div class="message-modal-content">
                <div class="message-icon" id="messageIcon">ℹ️</div>
                <div class="message-title" id="messageTitle">提示</div>
                <div class="message-text" id="messageText">消息内容</div>
                <div class="message-buttons">
                    <button class="btn-ok" onclick="hideMessage()">确定</button>
                </div>
            </div>
        </div>
        
        <!-- 删除确认对话框 -->
        <div class="delete-modal" id="deleteModal">
            <div class="delete-modal-content">
                <div class="delete-icon">⚠️</div>
                <div class="delete-title">确认删除</div>
                <div class="delete-message">
                    您确定要删除这条备忘录吗？<br>
                    <strong>此操作不可恢复！</strong>
                </div>
                <div class="delete-buttons">
                    <button class="btn-cancel" onclick="hideDeleteConfirm()">取消</button>
                    <button class="btn-confirm-delete" onclick="confirmDelete()">确认删除</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // 模态弹窗相关函数
        function showMessage(type, title, text, callback) {
            const modal = document.getElementById('messageModal');
            if (!modal) {
                console.error('Modal element not found');
                return;
            }
            
            const icon = document.getElementById('messageIcon');
            const titleEl = document.getElementById('messageTitle');
            const textEl = document.getElementById('messageText');
            
            // 设置图标和样式
            icon.className = 'message-icon ' + type;
            switch(type) {
                case 'success':
                    icon.textContent = '✓';
                    break;
                case 'error':
                    icon.textContent = '⚠️';
                    break;
                case 'info':
                default:
                    icon.textContent = 'ℹ️';
                    break;
            }
            
            titleEl.textContent = title;
            textEl.innerHTML = text;
            modal.style.display = 'block';
            
            // 存储回调函数
            modal.callback = callback;
        }
        
        function hideMessage() {
            const modal = document.getElementById('messageModal');
            if (!modal) return;
            
            modal.style.display = 'none';
            
            // 执行回调函数
            if (modal.callback) {
                modal.callback();
                modal.callback = null;
            }
        }
        
        // 点击外部区域关闭模态弹窗
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
        
        // 检查登录状态并显示对应操作按钮
        function checkLoginStatus() {
            const userData = localStorage.getItem('memos_user');
            const sessionData = localStorage.getItem('memos_session');
            
            if (userData && sessionData) {
                try {
                    const user = JSON.parse(userData);
                    const memoCreatorId = ${memo.creatorId}; // 当前memo的创建者ID
                    
                    // 检查是否为创建者或管理员
                    const canEdit = (user.id === memoCreatorId) || user.is_admin;
                    
                    if (canEdit) {
                        // 可以编辑，显示编辑和删除按钮
                        document.getElementById('guestActions').style.display = 'none';
                        document.getElementById('userActions').style.display = 'block';
                    } else {
                        // 不能编辑，显示提示信息
                        document.getElementById('guestActions').style.display = 'none';
                        document.getElementById('userActions').style.display = 'none';
                        document.getElementById('noPermissionActions').style.display = 'block';
                    }
                    return true;
                } catch (error) {
                    console.error('解析用户数据失败:', error);
                }
            }
            
            // 未登录，显示登录提示
            document.getElementById('guestActions').style.display = 'block';
            document.getElementById('userActions').style.display = 'none';
            document.getElementById('noPermissionActions').style.display = 'none';
            return false;
        }
        
        function toggleEditForm() {
            // 检查登录状态
            if (!checkLoginStatus()) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            const form = document.getElementById('editForm');
            form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
        }
        
        // 显示删除确认对话框
        function showDeleteConfirm() {
            // 检查登录状态
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            document.getElementById('deleteModal').style.display = 'block';
        }
        
        // 隐藏删除确认对话框
        function hideDeleteConfirm() {
            document.getElementById('deleteModal').style.display = 'none';
        }
        
        // 确认删除
        async function confirmDelete() {
            hideDeleteConfirm();
            await deleteMemo();
        }
        
        document.getElementById('updateMemoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = document.getElementById('editContent').value;
            
            if (!content.trim()) {
                showMessage('error', '错误', '请输入备忘录内容');
                return;
            }
            
            // 检查登录状态并获取session token
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            try {
                const session = JSON.parse(sessionData);
                const sessionToken = 'session_' + session.userId;
                
                const response = await fetch('/api/v1/memo/${memo.id}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: JSON.stringify({ content })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('success', '更新成功', '备忘录更新成功！', function() {
                        location.reload();
                    });
                } else {
                    showMessage('error', '更新失败', result.error || result.message || '未知错误');
                }
            } catch (error) {
                showMessage('error', '更新失败', error.message);
            }
        });
        
        function showDeleteConfirm() {
            // 显示删除确认模态框
            document.querySelector('.delete-modal').style.display = 'block';
        }
        
        function hideDeleteConfirm() {
            // 隐藏删除确认模态框
            document.querySelector('.delete-modal').style.display = 'none';
        }
        
        document.querySelector('.btn-cancel').addEventListener('click', hideDeleteConfirm);
        
        document.querySelector('.btn-confirm-delete').addEventListener('click', deleteMemo);
        
        async function deleteMemo() {
            // 检查登录状态
            const sessionData = localStorage.getItem('memos_session');
            if (!sessionData) {
                showMessage('error', '登录超时', '请先登录', function() {
                    window.location.href = '/login';
                });
                return;
            }
            
            try {
                const session = JSON.parse(sessionData);
                const sessionToken = 'session_' + session.userId;
                
                const response = await fetch('/api/v1/memo/${memo.id}', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + sessionToken
                    }
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('success', '删除成功', '备忘录删除成功！', function() {
                        window.location.href = '/';
                    });
                } else {
                    showMessage('error', '删除失败', result.error || result.message || '未知错误');
                }
            } catch (error) {
                showMessage('error', '删除失败', error.message);
            }
        }
        
        // 页面加载时检查登录状态
        window.addEventListener('load', function() {
            checkLoginStatus();
        });
    </script>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating memo detail HTML:', error);
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>加载失败 - Memos</title>
</head>
<body>
    <div style="padding: 20px; text-align: center;">
        <h1>加载失败</h1>
        <p>无法加载备忘录详情：${error.message}</p>
        <a href="/">返回首页</a>
    </div>
</body>
</html>`;
  }
}

async function getUserPageHTML(request, userId) {
  try {
    const db = request.env.DB;
    
    // 获取用户信息
    const userStmt = db.prepare(`
      SELECT id, username, nickname, email, created_ts, is_admin
      FROM users
      WHERE id = ?
    `);
    const user = await userStmt.bind(userId).first();
    
    if (!user) {
      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>用户不存在 - Memos</title>
</head>
<body>
    <div style="padding: 20px; text-align: center;">
        <h1>用户不存在</h1>
        <p>找不到指定的用户</p>
        <a href="/">返回首页</a>
    </div>
</body>
</html>`;
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
      memo.resourceList = resources || [];
      memo.relationList = [];
      memo.pinned = Boolean(memo.pinned);
    }
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.nickname} 的备忘录 - Memos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .user-header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .user-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: block;
            border: 3px solid #667eea;
        }
        
        .user-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .user-username {
            color: #666;
            font-size: 16px;
            margin-bottom: 15px;
        }
        
        .user-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .admin-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .back-btn {
            display: inline-block;
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .back-btn:hover {
            background: #545b62;
        }
        
        .memo-list {
            space-y: 20px;
        }
        
        .memo-item {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        
        .memo-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .memo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .memo-time {
            color: #999;
            font-size: 14px;
        }
        
        .memo-content {
            margin-bottom: 15px;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.6;
        }
        
        .memo-resources {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .resource-item {
            display: inline-block;
            padding: 5px 10px;
            background: #e3f2fd;
            border-radius: 4px;
            text-decoration: none;
            color: #1976d2;
            font-size: 14px;
        }
        
        .resource-item:hover {
            background: #bbdefb;
        }
        
        .memo-actions {
            text-align: right;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
        
        .btn {
            display: inline-block;
            padding: 6px 12px;
            margin-left: 8px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .btn:hover {
            background: #0056b3;
        }
        
        .pinned {
            border-left: 4px solid #ff9800;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 8px;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .user-stats {
                gap: 20px;
            }
            
            .memo-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="user-header">
            <img src="${getGravatarUrl(user.email, 80, request)}" alt="${user.nickname}的头像" class="user-avatar">
            <div class="user-name">
                ${user.nickname}
                ${user.is_admin ? '<span class="admin-badge">管理员</span>' : ''}
            </div>
            <div class="user-username">@${user.username}</div>
            <div class="user-stats">
                <div class="stat-item">
                    <div class="stat-number">${memos.length}</div>
                    <div class="stat-label">备忘录</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${new Date(user.created_ts * 1000).getFullYear()}</div>
                    <div class="stat-label">加入年份</div>
                </div>
            </div>
        </div>
        
        <div class="section-header">
            <div class="section-title">📝 ${user.nickname} 的备忘录</div>
            <a href="/" class="back-btn">← 返回首页</a>
        </div>
        
        <div class="memo-list">
            ${Array.isArray(memos) && memos.length > 0 ? memos.map(memo => `
                <div class="memo-item ${memo.pinned ? 'pinned' : ''}">
                    <div class="memo-header">
                        <div>
                            ${memo.pinned ? '<span style="color: #ff9800;">📌 置顶</span>' : ''}
                        </div>
                        <div class="memo-time">
                            ${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    <div class="memo-content">${memo.content}</div>
                    ${memo.resourceList && memo.resourceList.length > 0 ? `
                        <div class="memo-resources">
                            ${memo.resourceList.map(resource => `
                                <a href="${resource.externalLink || resource.filepath}" class="resource-item" target="_blank">
                                    📎 ${resource.filename}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="memo-actions">
                        <a href="/m/${memo.id}" class="btn">查看详情</a>
                    </div>
                </div>
            `).join('') : `
                <div class="empty-state">
                    <h3>暂无公开备忘录</h3>
                    <p>${user.nickname} 还没有创建公开的备忘录</p>
                </div>
            `}
        </div>
    </div>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating user page HTML:', error);
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>加载失败 - Memos</title>
</head>
<body>
    <div style="padding: 20px; text-align: center;">
        <h1>加载失败</h1>
        <p>无法加载用户页面：${error.message}</p>
        <a href="/">返回首页</a>
    </div>
</body>
</html>`;
  }
}
