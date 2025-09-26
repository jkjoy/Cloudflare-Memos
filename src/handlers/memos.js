import { Router } from 'itty-router';
import { requireAuth, jsonResponse, errorResponse, getRequestBody } from '../utils/auth';

// 简单的密码哈希函数
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const router = Router({ base: '/api/v1/memo' });

// 获取memo列表 - 无需权限
router.get('/', async (request) => {
  try {
    const db = request.env.DB;
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const creatorId = url.searchParams.get('creatorId');
    const rowStatus = url.searchParams.get('rowStatus');
    const visibility = url.searchParams.get('visibility');
    
    // 构建动态查询条件
    let whereConditions = ['m.row_status = ? AND m.visibility = ?'];
    let whereValues = ['NORMAL', 'PUBLIC'];
    
    if (creatorId) {
      whereConditions.push('m.creator_id = ?');
      whereValues.push(creatorId);
    }
    
    if (rowStatus) {
      whereConditions.push('m.row_status = ?');
      whereValues.push(rowStatus);
    }
    
    if (visibility) {
      whereConditions.push('m.visibility = ?');
      whereValues.push(visibility);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
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
      ${whereClause}
      ORDER BY m.pinned DESC, m.display_ts DESC
      LIMIT ? OFFSET ?
    `);
    
    // 绑定参数
    const bindValues = [...whereValues, limit, offset];
    const { results } = await stmt.bind(...bindValues).all();
    
    // 获取每个memo的资源列表
    for (let memo of results) {
      const resourceStmt = db.prepare(`
        SELECT r.id, r.creator_id as creatorId, r.filename, r.filepath, r.type, r.size, r.created_ts as createdTs, r.created_ts as updatedTs
        FROM resources r
        JOIN memo_resources mr ON r.id = mr.resource_id
        WHERE mr.memo_id = ?
      `);
      const { results: resources } = await resourceStmt.bind(memo.id).all();
      
      // 格式化资源列表以匹配要求的结构
      memo.resourceList = resources.map(resource => ({
        id: resource.id,
        creatorId: resource.creatorId,
        createdTs: resource.createdTs,
        updatedTs: resource.updatedTs,
        filename: resource.filename,
        externalLink: resource.filepath, // 使用R2真实地址
        type: resource.type,
        size: resource.size
      })) || [];
      
      memo.relationList = []; // 暂时为空
      memo.pinned = Boolean(memo.pinned);
      
      // 隐藏邮箱地址保护隐私
      delete memo.creatorEmail;
    }
    
    return jsonResponse(results);
  } catch (error) {
    console.error('Error fetching memos:', error);
    return errorResponse('Failed to fetch memos', 500);
  }
});

// 获取用户memo统计信息 - 无需权限
router.get('/stats', async (request) => {
  try {
    const db = request.env.DB;
    const url = new URL(request.url);
    const creatorId = url.searchParams.get('creatorId');
    
    if (!creatorId) {
      return errorResponse('creatorId parameter is required');
    }
    
    // 验证用户是否存在
    const userStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const user = await userStmt.bind(creatorId).first();
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    // 获取用户的所有memo创建时间戳，按时间倒序排列
    const stmt = db.prepare(`
      SELECT created_ts as createdTs
      FROM memos 
      WHERE creator_id = ? AND row_status = 'NORMAL'
      ORDER BY created_ts DESC
    `);
    
    const { results } = await stmt.bind(creatorId).all();
    
    // 只返回时间戳数组
    const timestamps = results.map(memo => memo.createdTs);
    
    return jsonResponse(timestamps);
  } catch (error) {
    console.error('Error fetching memo stats:', error);
    return errorResponse('Failed to fetch memo stats', 500);
  }
});

// 获取单个memo详情
router.get('/:id', async (request) => {
  try {
    const db = request.env.DB;
    
    const { id } = request.params;
    
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
      WHERE m.id = ? AND m.row_status = 'NORMAL'
    `);
    
    const memo = await stmt.bind(id).first();
    
    if (!memo) {
      return errorResponse('Memo not found', 404);
    }
    
    // 获取资源列表
    const resourceStmt = db.prepare(`
      SELECT r.id, r.creator_id as creatorId, r.filename, r.filepath, r.type, r.size, r.created_ts as createdTs, r.created_ts as updatedTs
      FROM resources r
      JOIN memo_resources mr ON r.id = mr.resource_id
      WHERE mr.memo_id = ?
    `);
    const { results: resources } = await resourceStmt.bind(id).all();
    
    // 格式化资源列表以匹配要求的结构
    memo.resourceList = resources.map(resource => ({
      id: resource.id,
      creatorId: resource.creatorId,
      createdTs: resource.createdTs,
      updatedTs: resource.updatedTs,
      filename: resource.filename,
      externalLink: resource.filepath, // 使用R2真实地址
      type: resource.type,
      size: resource.size
    })) || [];
    
    memo.relationList = [];
    memo.pinned = Boolean(memo.pinned);
    
    // 隐藏邮箱地址保护隐私
    delete memo.creatorEmail;
    
    return jsonResponse(memo);
  } catch (error) {
    console.error('Error fetching memo:', error);
    return errorResponse('Failed to fetch memo', 500);
  }
});

// 创建memo - 需要权限
router.post('/', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const body = await getRequestBody(request);
    
    // 允许内容为空，但至少要有内容或资源
    if (!body.content && (!body.resourceIdList || body.resourceIdList.length === 0)) {
      return errorResponse('Content or resources are required');
    }
    
    // 获取当前登录用户的ID
    let creatorId = request.user?.id;
    
    // 如果没有用户信息，说明使用的是管理员TOKEN，创建默认管理员用户
    if (!creatorId) {
      const userCheck = await db.prepare('SELECT COUNT(*) as count FROM users').first();
      
      if (userCheck.count === 0) {
        // 创建第一个用户（管理员）
        const userStmt = db.prepare(`
          INSERT INTO users (username, nickname, password_hash, is_admin) 
          VALUES (?, ?, ?, 1)
        `);
        // 使用默认密码 'admin123'
        const defaultPasswordHash = await hashPassword('admin123');
        const userResult = await userStmt.bind('admin', '管理员', defaultPasswordHash).run();
        creatorId = userResult.meta.last_row_id;
      } else {
        creatorId = 1; // 默认使用第一个用户
      }
    }
    
    const stmt = db.prepare(`
      INSERT INTO memos (creator_id, content, visibility, display_ts)
      VALUES (?, ?, ?, ?)
    `);
    
    const now = Math.floor(Date.now() / 1000);
    const result = await stmt.bind(
      creatorId,
      body.content || '', // 允许空内容
      body.visibility || 'PUBLIC',
      now
    ).run();
    
    const memoId = result.meta.last_row_id;
    
    // 处理资源列表
    if (body.resourceIdList && Array.isArray(body.resourceIdList)) {
      for (const resourceId of body.resourceIdList) {
        // 直接关联已上传的资源
        const linkStmt = db.prepare(`
          INSERT INTO memo_resources (memo_id, resource_id)
          VALUES (?, ?)
        `);
        await linkStmt.bind(memoId, resourceId).run();
      }
    }
    
    return jsonResponse({ 
      id: memoId,
      message: 'Memo created successfully' 
    }, 201);
  } catch (error) {
    console.error('Error creating memo:', error);
    return errorResponse('Failed to create memo', 500);
  }
});

// 修改memo - 需要权限和所有权
router.put('/:id', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const { id } = request.params;
    const body = await getRequestBody(request);
    
    if (!body.content) {
      return errorResponse('Content is required');
    }
    
    // 检查memo是否存在并获取创建者信息
    const memoStmt = db.prepare(`
      SELECT creator_id 
      FROM memos 
      WHERE id = ? AND row_status = 'NORMAL'
    `);
    const memo = await memoStmt.bind(id).first();
    
    if (!memo) {
      return errorResponse('Memo not found', 404);
    }
    
    // 权限检查：只有创建者或管理员才能编辑
    const currentUser = request.user;
    if (!currentUser) {
      return errorResponse('User information not found', 401);
    }
    
    if (memo.creator_id !== currentUser.id && !currentUser.isAdmin) {
      return errorResponse('Permission denied: You can only edit your own memos', 403);
    }
    
    // 执行更新
    const updateStmt = db.prepare(`
      UPDATE memos 
      SET content = ?, updated_ts = ?
      WHERE id = ? AND row_status = 'NORMAL'
    `);
    
    const now = Math.floor(Date.now() / 1000);
    const result = await updateStmt.bind(body.content, now, id).run();
    
    if (result.changes === 0) {
      return errorResponse('Failed to update memo', 500);
    }
    
    return jsonResponse({ message: 'Memo updated successfully' });
  } catch (error) {
    console.error('Error updating memo:', error);
    return errorResponse('Failed to update memo', 500);
  }
});

// 删除memo - 需要权限和所有权
router.delete('/:id', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const { id } = request.params;
    
    // 检查memo是否存在并获取创建者信息
    const memoStmt = db.prepare(`
      SELECT creator_id 
      FROM memos 
      WHERE id = ? AND row_status = 'NORMAL'
    `);
    const memo = await memoStmt.bind(id).first();
    
    if (!memo) {
      return errorResponse('Memo not found', 404);
    }
    
    // 权限检查：只有创建者或管理员才能删除
    const currentUser = request.user;
    if (!currentUser) {
      return errorResponse('User information not found', 401);
    }
    
    if (memo.creator_id !== currentUser.id && !currentUser.isAdmin) {
      return errorResponse('Permission denied: You can only delete your own memos', 403);
    }
    
    // 执行删除（软删除）
    const deleteStmt = db.prepare(`
      UPDATE memos 
      SET row_status = 'ARCHIVED', updated_ts = ?
      WHERE id = ? AND row_status = 'NORMAL'
    `);
    
    const now = Math.floor(Date.now() / 1000);
    const result = await deleteStmt.bind(now, id).run();
    
    if (result.changes === 0) {
      return errorResponse('Failed to delete memo', 500);
    }
    
    return jsonResponse({ message: 'Memo deleted successfully' });
  } catch (error) {
    console.error('Error deleting memo:', error);
    return errorResponse('Failed to delete memo', 500);
  }
});

export async function handleMemoRoutes(request) {
  return router.handle(request);
}
