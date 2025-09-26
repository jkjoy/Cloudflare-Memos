import { corsHeaders } from '../utils/cors';

// TOKEN认证中间件
export async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.headers.get('X-Token') ||
                new URL(request.url).searchParams.get('token');
  
  // 检查是否是会话令牌（以session_开头）
  if (token && token.startsWith('session_')) {
    const userId = token.replace('session_', '');
    if (userId) {
      // 获取用户信息进行验证
      const db = request.env.DB;
      if (db) {
        try {
          const userStmt = db.prepare('SELECT id, username, nickname, is_admin FROM users WHERE id = ?');
          const user = await userStmt.bind(userId).first();
          
          if (user) {
            // 将用户信息附加到request对象上
            request.user = {
              id: user.id,
              username: user.username,
              nickname: user.nickname,
              isAdmin: Boolean(user.is_admin)
            };
            return null; // 认证通过
          }
        } catch (error) {
          console.error('Error validating user session:', error);
        }
      }
    }
  }
  
  const expectedToken = request.env.TOKEN;
  
  if (!expectedToken) {
    return new Response(JSON.stringify({ 
      error: 'Server configuration error',
      message: 'TOKEN not configured' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders
      }
    });
  }
  
  if (!token || token !== expectedToken) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: 'Valid token required' 
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders
      }
    });
  }
  
  return null; // 认证通过
}

// JSON响应辅助函数
export function jsonResponse(data, status = 200) {
  // 确保UTF-8编码正确处理中文字符
  let jsonString;
  try {
    // 使用JSON.stringify并显式处理Unicode字符
    jsonString = JSON.stringify(data, (key, value) => {
      if (typeof value === 'string') {
        // 确保字符串正确编码
        return value;
      }
      return value;
    }, 0);
  } catch (error) {
    console.error('JSON serialization error:', error);
    jsonString = JSON.stringify({ error: 'Serialization failed' });
  }
  
  return new Response(jsonString, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Accept-Charset': 'utf-8',
      ...corsHeaders
    }
  });
}

// 错误响应辅助函数
export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// 获取请求体JSON
export async function getRequestBody(request) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      return await request.json();
    }
    return {};
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}