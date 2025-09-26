import { Router } from 'itty-router';
import { requireAuth, jsonResponse, errorResponse } from '../utils/auth';

// 简单的密码哈希函数
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const router = Router({ base: '/api/v1/resource' });

// 获取资源列表 - 需要权限
router.get('List', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    const stmt = db.prepare(`
      SELECT r.id, r.filename, r.filepath, r.type, r.size, r.created_ts,
             u.username as creator_username, u.name as creator_name
      FROM resources r
      LEFT JOIN users u ON r.creator_id = u.id
      ORDER BY r.created_ts DESC
      LIMIT ? OFFSET ?
    `);
    
    const { results } = await stmt.bind(limit, offset).all();
    
    return jsonResponse(results);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return errorResponse('Failed to fetch resources', 500);
  }
});

// 文件代理路由 - 无需权限
router.get('/:id/file', async (request) => {
  try {
    const db = request.env.DB;
    const { id } = request.params;
    
    const stmt = db.prepare(`
      SELECT id, filename, filepath, type, size
      FROM resources
      WHERE id = ?
    `);
    
    const resource = await stmt.bind(id).first();
    
    if (!resource) {
      return errorResponse('Resource not found', 404);
    }
    
    // 直接重定向到R2存储的URL
    if (resource.filepath.startsWith('http')) {
      return Response.redirect(resource.filepath, 302);
    }
    
    return errorResponse('Invalid resource path', 400);
  } catch (error) {
    console.error('Error proxying resource:', error);
    return errorResponse('Failed to access resource', 500);
  }
});

// 获取单个资源 - 无需权限
router.get('/:id', async (request) => {
  try {
    const db = request.env.DB;
    const { id } = request.params;
    
    const stmt = db.prepare(`
      SELECT id, filename, filepath, type, size, created_ts
      FROM resources
      WHERE id = ?
    `);
    
    const resource = await stmt.bind(id).first();
    
    if (!resource) {
      return errorResponse('Resource not found', 404);
    }
    
    // 如果是图片，直接重定向到存储的URL
    if (resource.filepath.startsWith('http')) {
      return Response.redirect(resource.filepath, 302);
    }
    
    return jsonResponse(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return errorResponse('Failed to fetch resource', 500);
  }
});

// 上传资源 - 需要权限
router.post('/', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const bucket = request.env.BUCKET;
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return errorResponse('No file provided');
    }
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${timestamp}_${randomString}.${fileExtension}`;
    
    // 上传到R2存储
    const uploadResult = await bucket.put(uniqueFilename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    if (!uploadResult) {
      return errorResponse('Failed to upload file', 500);
    }
    
    // 构建访问URL - 使用环境变量或默认域名
    const r2Domain = request.env.R2_DOMAIN || 'pub-7f9c6818d8c543e2bb3b3bc7c81c3d5b.r2.dev';
    const fileUrl = `https://${r2Domain}/${uniqueFilename}`;
    
    // 获取创建者ID（从认证信息获取）
    let creatorId = request.user?.id;
    
    // 如果没有用户信息，使用默认管理员
    if (!creatorId) {
      const userCheck = await db.prepare('SELECT COUNT(*) as count FROM users').first();
      if (userCheck.count === 0) {
        // 创建默认用户 - 使用中文名称
        const userStmt = db.prepare(`
          INSERT INTO users (username, nickname, password_hash, is_admin) 
          VALUES (?, ?, ?, 1)
        `);
        const defaultPasswordHash = await hashPassword('admin123');
        const userResult = await userStmt.bind('admin', '管理员', defaultPasswordHash).run();
        creatorId = userResult.meta.last_row_id;
      } else {
        creatorId = 1; // 使用第一个用户
      }
    }
    
    // 保存资源信息到数据库
    const stmt = db.prepare(`
      INSERT INTO resources (creator_id, filename, filepath, type, size)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      creatorId,
      file.name,
      fileUrl,
      file.type,
      file.size
    ).run();
    
    return jsonResponse({
      id: result.meta.last_row_id,
      filename: file.name,
      filepath: fileUrl,
      type: file.type,
      size: file.size,
      message: 'File uploaded successfully'
    }, 201);
  } catch (error) {
    console.error('Error uploading resource:', error);
    return errorResponse('Failed to upload resource', 500);
  }
});

export async function handleResourceRoutes(request) {
  return router.handle(request);
}