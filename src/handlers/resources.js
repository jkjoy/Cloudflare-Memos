import { Hono } from 'hono';
import { requireAuth, jsonResponse, errorResponse, ensureDefaultUser } from '../utils/auth';

const app = new Hono();

// 获取资源列表 - 需要权限
app.get('List', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;
    const limit = parseInt(c.req.query('limit')) || 20;
    const offset = parseInt(c.req.query('offset')) || 0;
    
    const stmt = db.prepare(`
      SELECT r.id, r.filename, r.filepath, r.type, r.size, r.created_ts,
             u.username as creator_username, u.nickname as creator_name
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

// 文件代理路由 - 直接从 R2 读取并返回
app.get('/:id/file', async (c) => {
  try {
    const db = c.env.DB;
    const bucket = c.env.BUCKET;
    const id = c.req.param('id');

    const stmt = db.prepare(`
      SELECT id, filename, filepath, type, size
      FROM resources
      WHERE id = ?
    `);

    const resource = await stmt.bind(id).first();

    if (!resource) {
      return errorResponse('Resource not found', 404);
    }

    // 从 filepath 中提取 R2 对象的 key（文件名）
    let objectKey = resource.filepath;

    // 如果 filepath 是完整 URL，提取文件名部分
    if (objectKey.startsWith('http')) {
      const url = new URL(objectKey);
      objectKey = url.pathname.substring(1); // 移除开头的 /
    }

    // 从 R2 获取文件
    const object = await bucket.get(objectKey);

    if (!object) {
      return errorResponse('File not found in storage', 404);
    }

    // 返回文件内容
    return new Response(object.body, {
      headers: {
        'Content-Type': resource.type || 'application/octet-stream',
        'Content-Length': resource.size?.toString() || '',
        'Content-Disposition': `inline; filename="${encodeURIComponent(resource.filename)}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error proxying resource:', error);
    return errorResponse('Failed to access resource', 500);
  }
});

// 获取单个资源 - 无需权限
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    
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
app.post('/', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;
    const bucket = c.env.BUCKET;

    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse('No file provided');
    }

    // 文件大小验证 (最大 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 文件类型白名单验证 - 扩展支持更多类型
    const ALLOWED_TYPES = [
      // 图片
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      // 文档
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // 压缩文件
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar',
      // 视频
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      // 音频
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      // 其他
      'application/json',
      'text/csv',
      'application/xml',
      'text/xml'
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(`File type '${file.type}' is not allowed. Allowed types: images, videos, audio, PDF, documents, and archives.`);
    }

    // 文件名验证 (防止路径遍历攻击)
    const filename = file.name;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return errorResponse('Invalid filename');
    }

    // 获取创建者ID（从认证信息获取）
    let creatorId = c.get('user')?.id;

    // 如果没有用户信息，使用默认管理员
    if (!creatorId) {
      creatorId = await ensureDefaultUser(c.env.DB);
    }

    // 生成文件名：用户ID_时间戳.后缀
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${creatorId}_${timestamp}.${fileExtension}`;

    // 上传到R2存储
    const uploadResult = await bucket.put(uniqueFilename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    if (!uploadResult) {
      return errorResponse('Failed to upload file', 500);
    }

    // 保存资源信息到数据库 - filepath 存储文件名
    const stmt = db.prepare(`
      INSERT INTO resources (creator_id, filename, filepath, type, size)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = await stmt.bind(
      creatorId,
      file.name,
      uniqueFilename,  // 存储文件名
      file.type,
      file.size
    ).run();

    const resourceId = result.meta.last_row_id;

    // 获取 Worker 的 URL（从请求中获取）
    const workerUrl = new URL(c.req.url).origin;
    const fileUrl = `${workerUrl}/${uniqueFilename}`;

    return jsonResponse({
      id: resourceId,
      filename: file.name,
      filepath: fileUrl,  // 返回完整 URL
      type: file.type,
      size: file.size,
      message: 'File uploaded successfully'
    }, 201);
  } catch (error) {
    console.error('Error uploading resource:', error);
    return errorResponse('Failed to upload resource', 500);
  }
});

export default app;
