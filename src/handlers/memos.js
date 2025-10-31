import { Hono } from 'hono';
import { requireAuth, jsonResponse, errorResponse, hashPassword, generateSecurePassword } from '../utils/auth';
import { simpleMD5 } from '../utils/gravatar';

const app = new Hono();

// 获取memo列表
app.get('/', async (c) => {
  try {
    const db = c.env.DB;

    const limit = parseInt(c.req.query('limit')) || 20;
    const offset = parseInt(c.req.query('offset')) || 0;
    const creatorId = c.req.query('creatorId');
    const rowStatus = c.req.query('rowStatus');
    const visibility = c.req.query('visibility');

    // 获取 Worker URL
    const workerUrl = new URL(c.req.url).origin;

    // 尝试获取当前登录用户
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let currentUser = null;
    if (token) {
      try {
        const { validateSession } = await import('../utils/auth.js');
        currentUser = await validateSession(c.env.DB, token);
      } catch (e) {
        // 忽略验证错误，继续作为未登录用户
      }
    }

    // 构建动态查询条件
    let whereConditions = [];
    let whereValues = [];

    // 默认条件
    if (!rowStatus) {
      whereConditions.push('m.row_status = ?');
      whereValues.push('NORMAL');
    } else {
      whereConditions.push('m.row_status = ?');
      whereValues.push(rowStatus);
    }

    // 可见性处理：如果指定了creatorId且是当前用户，则显示所有memo（公开+私密）
    if (creatorId && currentUser && parseInt(creatorId) === currentUser.id) {
      // 当前用户查看自己的memo，不添加visibility限制
      whereConditions.push('m.creator_id = ?');
      whereValues.push(creatorId);
    } else {
      // 其他情况：只显示公开memo
      if (!visibility) {
        whereConditions.push('m.visibility = ?');
        whereValues.push('PUBLIC');
      } else {
        whereConditions.push('m.visibility = ?');
        whereValues.push(visibility);
      }

      if (creatorId) {
        whereConditions.push('m.creator_id = ?');
        whereValues.push(creatorId);
      }
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // 使用 LEFT JOIN 一次性获取所有 memo 和资源,避免 N+1 查询
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
        u.email as creatorEmail,
        r.id as resourceId,
        r.creator_id as resourceCreatorId,
        r.filename as resourceFilename,
        r.filepath as resourceFilepath,
        r.type as resourceType,
        r.size as resourceSize,
        r.created_ts as resourceCreatedTs
      FROM memos m
      LEFT JOIN users u ON m.creator_id = u.id
      LEFT JOIN memo_resources mr ON m.id = mr.memo_id
      LEFT JOIN resources r ON mr.resource_id = r.id
      ${whereClause}
      ORDER BY m.pinned DESC, m.display_ts DESC
      LIMIT ? OFFSET ?
    `);

    // 绑定参数
    const bindValues = [...whereValues, limit * 10, offset]; // 扩大查询范围以获取足够的资源
    const { results: rawResults } = await stmt.bind(...bindValues).all();

    // 合并结果,将资源组合到对应的 memo 中
    const memosMap = new Map();

    for (const row of rawResults) {
      if (!memosMap.has(row.id)) {
        memosMap.set(row.id, {
          id: row.id,
          rowStatus: row.rowStatus,
          creatorId: row.creatorId,
          createdTs: row.createdTs,
          updatedTs: row.updatedTs,
          displayTs: row.displayTs,
          content: row.content,
          visibility: row.visibility,
          pinned: Boolean(row.pinned),
          parent: row.parent,
          creatorName: row.creatorName,
          creatorUsername: row.creatorUsername,
          creatorEmail: row.creatorEmail,
          resourceList: [],
          relationList: []
        });
      }

      // 添加资源到列表
      if (row.resourceId) {
        const memo = memosMap.get(row.id);
        // 构建完整 URL - 确保正确处理路径
        let resourceUrl = row.resourceFilepath;
        if (!resourceUrl.startsWith('http')) {
          // 如果是相对路径，确保有前导斜杠
          if (!resourceUrl.startsWith('/')) {
            resourceUrl = '/' + resourceUrl;
          }
          // 构建完整URL
          resourceUrl = `${workerUrl}${resourceUrl}`;
        }

        memo.resourceList.push({
          id: row.resourceId,
          creatorId: row.resourceCreatorId,
          createdTs: row.resourceCreatedTs,
          updatedTs: row.resourceCreatedTs,
          filename: row.resourceFilename,
          externalLink: resourceUrl,  // 使用完整 URL
          type: row.resourceType,
          size: row.resourceSize
        });
      }
    }

    // 转换为数组并限制数量
    const results = Array.from(memosMap.values()).slice(0, limit);

    // 获取每个memo的标签
    for (const memo of results) {
      const tagStmt = db.prepare(`
        SELECT t.id, t.name
        FROM tags t
        JOIN memo_tags mt ON t.id = mt.tag_id
        WHERE mt.memo_id = ?
      `);
      const { results: tags } = await tagStmt.bind(memo.id).all();
      memo.tagList = tags || [];
    }

    // 隐藏邮箱地址保护隐私，但保留emailHash用于头像
    for (const memo of results) {
      if (memo.creatorEmail) {
        // 计算email的MD5 hash用于Gravatar头像
        const emailLower = memo.creatorEmail.toLowerCase().trim();
        memo.creatorEmailHash = simpleMD5(emailLower);
      }
      delete memo.creatorEmail;
    }

    // 获取总数用于分页
    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT m.id) as total
      FROM memos m
      ${whereClause}
    `);
    const countResult = await countStmt.bind(...whereValues).first();
    const total = countResult?.total || 0;

    // 直接返回数组，不包装在 data 中
    return jsonResponse(results);
  } catch (error) {
    console.error('Error fetching memos:', error);
    return errorResponse('Failed to fetch memos', 500);
  }
});

// 搜索memo - 无需权限
app.get('/search', async (c) => {
  try {
    const db = c.env.DB;
    const query = c.req.query('q');
    const searchContent = c.req.query('content') === 'true';
    const searchTags = c.req.query('tags') === 'true';
    const searchUsername = c.req.query('username') === 'true';

    if (!query) {
      return errorResponse('Search query is required');
    }

    const searchPattern = `%${query}%`;
    let memoIds = new Set();

    // 搜索内容
    if (searchContent) {
      const contentStmt = db.prepare(`
        SELECT id FROM memos
        WHERE content LIKE ? AND row_status = 'NORMAL' AND visibility = 'PUBLIC'
      `);
      const { results } = await contentStmt.bind(searchPattern).all();
      results.forEach(r => memoIds.add(r.id));
    }

    // 搜索标签
    if (searchTags) {
      const tagStmt = db.prepare(`
        SELECT mt.memo_id
        FROM memo_tags mt
        JOIN tags t ON mt.tag_id = t.id
        JOIN memos m ON mt.memo_id = m.id
        WHERE t.name LIKE ? AND m.row_status = 'NORMAL' AND m.visibility = 'PUBLIC'
      `);
      const { results } = await tagStmt.bind(searchPattern).all();
      results.forEach(r => memoIds.add(r.memo_id));
    }

    // 搜索用户名
    if (searchUsername) {
      const userStmt = db.prepare(`
        SELECT m.id
        FROM memos m
        JOIN users u ON m.creator_id = u.id
        WHERE (u.username LIKE ? OR u.nickname LIKE ?)
        AND m.row_status = 'NORMAL' AND m.visibility = 'PUBLIC'
      `);
      const { results } = await userStmt.bind(searchPattern, searchPattern).all();
      results.forEach(r => memoIds.add(r.id));
    }

    if (memoIds.size === 0) {
      return jsonResponse([]);
    }

    // 获取memo详情
    const memoIdsArray = Array.from(memoIds);
    const placeholders = memoIdsArray.map(() => '?').join(',');

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
      WHERE m.id IN (${placeholders})
      ORDER BY m.pinned DESC, m.display_ts DESC
    `);

    const { results: memos } = await stmt.bind(...memoIdsArray).all();

    // 获取每个memo的资源和标签
    for (const memo of memos) {
      // 获取资源
      const resourceStmt = db.prepare(`
        SELECT r.id, r.filename, r.filepath, r.type, r.size
        FROM resources r
        JOIN memo_resources mr ON r.id = mr.resource_id
        WHERE mr.memo_id = ?
      `);
      const { results: resources } = await resourceStmt.bind(memo.id).all();
      memo.resourceList = (resources || []).map(r => ({
        ...r,
        filepath: r.filepath.startsWith('http') || r.filepath.startsWith('/api/')
          ? r.filepath
          : `/api/v1/resource/${r.id}/file`
      }));

      // 获取标签
      const tagStmt = db.prepare(`
        SELECT t.id, t.name
        FROM tags t
        JOIN memo_tags mt ON t.id = mt.tag_id
        WHERE mt.memo_id = ?
      `);
      const { results: tags } = await tagStmt.bind(memo.id).all();
      memo.tagList = tags || [];

      // 计算email hash用于头像
      if (memo.creatorEmail) {
        const emailLower = memo.creatorEmail.toLowerCase().trim();
        memo.creatorEmailHash = simpleMD5(emailLower);
      }
      delete memo.creatorEmail;
      memo.pinned = Boolean(memo.pinned);
    }

    return jsonResponse(memos);
  } catch (error) {
    console.error('Error searching memos:', error);
    return errorResponse('Failed to search memos', 500);
  }
});

// 获取用户memo统计信息 - 无需权限
app.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    const creatorId = c.req.query('creatorId');
    
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
app.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');

    // 使用 LEFT JOIN 一次性获取 memo 和所有资源
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
        u.email as creatorEmail,
        r.id as resourceId,
        r.creator_id as resourceCreatorId,
        r.filename as resourceFilename,
        r.filepath as resourceFilepath,
        r.type as resourceType,
        r.size as resourceSize,
        r.created_ts as resourceCreatedTs
      FROM memos m
      LEFT JOIN users u ON m.creator_id = u.id
      LEFT JOIN memo_resources mr ON m.id = mr.memo_id
      LEFT JOIN resources r ON mr.resource_id = r.id
      WHERE m.id = ? AND m.row_status = 'NORMAL'
    `);

    const { results: rawResults } = await stmt.bind(id).all();

    if (!rawResults || rawResults.length === 0) {
      return errorResponse('Memo not found', 404);
    }

    // 构建 memo 对象
    const firstRow = rawResults[0];
    const memo = {
      id: firstRow.id,
      rowStatus: firstRow.rowStatus,
      creatorId: firstRow.creatorId,
      createdTs: firstRow.createdTs,
      updatedTs: firstRow.updatedTs,
      displayTs: firstRow.displayTs,
      content: firstRow.content,
      visibility: firstRow.visibility,
      pinned: Boolean(firstRow.pinned),
      parent: firstRow.parent,
      creatorName: firstRow.creatorName,
      creatorUsername: firstRow.creatorUsername,
      creatorEmail: firstRow.creatorEmail,
      resourceList: [],
      relationList: []
    };

    // 添加所有资源
    for (const row of rawResults) {
      if (row.resourceId) {
        memo.resourceList.push({
          id: row.resourceId,
          creatorId: row.resourceCreatorId,
          createdTs: row.resourceCreatedTs,
          updatedTs: row.resourceCreatedTs,
          filename: row.resourceFilename,
          externalLink: row.resourceFilepath,
          type: row.resourceType,
          size: row.resourceSize
        });
      }
    }

    // 隐藏邮箱地址保护隐私
    delete memo.creatorEmail;

    return jsonResponse(memo);
  } catch (error) {
    console.error('Error fetching memo:', error);
    return errorResponse('Failed to fetch memo', 500);
  }
});

// 创建memo - 需要权限
app.post('/', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    
    // 允许内容为空，但至少要有内容或资源
    if (!body.content && (!body.resourceIdList || body.resourceIdList.length === 0)) {
      return errorResponse('Content or resources are required');
    }
    
    // 获取当前登录用户的ID
    let creatorId = c.get('user')?.id;

    // 如果没有用户信息，说明使用的是管理员TOKEN，创建默认管理员用户
    if (!creatorId) {
      const userCheck = await db.prepare('SELECT COUNT(*) as count FROM users').first();

      if (userCheck.count === 0) {
        // 生成安全的随机密码
        const randomPassword = generateSecurePassword(16);
        const passwordHash = await hashPassword(randomPassword);

        // 创建第一个用户（管理员）
        const userStmt = db.prepare(`
          INSERT INTO users (username, nickname, password_hash, is_admin)
          VALUES (?, ?, ?, 1)
        `);
        const userResult = await userStmt.bind('admin', '管理员', passwordHash).run();
        creatorId = userResult.meta.last_row_id;

        // 记录密码到日志
        console.log('='.repeat(60));
        console.log('⚠️  IMPORTANT: Default admin user created');
        console.log('Username: admin');
        console.log(`Password: ${randomPassword}`);
        console.log('Please change this password immediately after first login!');
        console.log('='.repeat(60));
      } else {
        creatorId = 1; // 默认使用第一个用户
      }
    }
    
    // 提取并保存标签，然后从内容中移除标签
    let cleanedContent = body.content || '';
    const tagNames = [];

    if (body.content) {
      const tagRegex = /#([^\s#]+)/g;
      const tagMatches = [...body.content.matchAll(tagRegex)];
      tagNames.push(...new Set(tagMatches.map(match => match[1]))); // 去重

      // 从内容中移除所有标签（只移除#标签部分，保持其他格式）
      if (tagNames.length > 0) {
        cleanedContent = body.content.replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim();
      }
    }

    const stmt = db.prepare(`
      INSERT INTO memos (creator_id, content, visibility, display_ts)
      VALUES (?, ?, ?, ?)
    `);

    const now = Math.floor(Date.now() / 1000);
    const result = await stmt.bind(
      creatorId,
      cleanedContent, // 使用清理后的内容
      body.visibility || 'PUBLIC',
      now
    ).run();

    const memoId = result.meta.last_row_id;

    // 保存标签
    for (const tagName of tagNames) {
      // 检查标签是否存在，不存在则创建
      let tagStmt = db.prepare('SELECT id FROM tags WHERE name = ?');
      let tag = await tagStmt.bind(tagName).first();

      let tagId;
      if (!tag) {
        // 创建新标签
        const createTagStmt = db.prepare('INSERT INTO tags (name) VALUES (?)');
        const tagResult = await createTagStmt.bind(tagName).run();
        tagId = tagResult.meta.last_row_id;
      } else {
        tagId = tag.id;
      }

      // 关联标签到memo
      const linkTagStmt = db.prepare('INSERT INTO memo_tags (memo_id, tag_id) VALUES (?, ?)');
      await linkTagStmt.bind(memoId, tagId).run();
    }

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
app.put('/:id', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();

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
    const currentUser = c.get('user');
    if (!currentUser) {
      return errorResponse('User information not found', 401);
    }

    if (memo.creator_id !== currentUser.id && !currentUser.isAdmin) {
      return errorResponse('Permission denied: You can only edit your own memos', 403);
    }

    // 构建更新字段
    const updateFields = ['content = ?', 'updated_ts = ?'];
    const updateValues = [body.content, Math.floor(Date.now() / 1000)];

    // 可选字段：可见性
    if (body.visibility !== undefined) {
      updateFields.push('visibility = ?');
      updateValues.push(body.visibility);
    }

    // 可选字段：置顶状态
    if (body.pinned !== undefined) {
      updateFields.push('pinned = ?');
      updateValues.push(body.pinned ? 1 : 0);
    }

    // 执行更新
    const updateStmt = db.prepare(`
      UPDATE memos
      SET ${updateFields.join(', ')}
      WHERE id = ? AND row_status = 'NORMAL'
    `);

    updateValues.push(id);
    const result = await updateStmt.bind(...updateValues).run();

    if (result.changes === 0) {
      return errorResponse('Failed to update memo', 500);
    }

    // 处理附件：删除指定的附件
    if (body.deleteResourceIds && Array.isArray(body.deleteResourceIds)) {
      for (const resourceId of body.deleteResourceIds) {
        const deleteStmt = db.prepare(`
          DELETE FROM memo_resources
          WHERE memo_id = ? AND resource_id = ?
        `);
        await deleteStmt.bind(id, resourceId).run();
      }
    }

    // 处理附件：添加新附件
    if (body.resourceIdList && Array.isArray(body.resourceIdList)) {
      for (const resourceId of body.resourceIdList) {
        // 检查是否已经关联，避免重复
        const checkStmt = db.prepare(`
          SELECT COUNT(*) as count
          FROM memo_resources
          WHERE memo_id = ? AND resource_id = ?
        `);
        const existing = await checkStmt.bind(id, resourceId).first();

        if (existing.count === 0) {
          const linkStmt = db.prepare(`
            INSERT INTO memo_resources (memo_id, resource_id)
            VALUES (?, ?)
          `);
          await linkStmt.bind(id, resourceId).run();
        }
      }
    }

    return jsonResponse({ message: 'Memo updated successfully' });
  } catch (error) {
    console.error('Error updating memo:', error);
    return errorResponse('Failed to update memo', 500);
  }
});

// 删除memo - 需要权限和所有权
app.delete('/:id', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    
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
    const currentUser = c.get('user');
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

// 获取热力图数据 - 最近一个月的发布统计
app.get('/stats/heatmap', async (c) => {
  try {
    const db = c.env.DB;

    // 获取最近30天的日期范围
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    // 查询每天的memo数量
    const stmt = db.prepare(`
      SELECT
        DATE(created_ts, 'unixepoch') as date,
        COUNT(*) as count
      FROM memos
      WHERE row_status = 'NORMAL'
        AND visibility = 'PUBLIC'
        AND created_ts >= ?
      GROUP BY DATE(created_ts, 'unixepoch')
      ORDER BY date ASC
    `);

    const { results } = await stmt.bind(thirtyDaysAgo).all();

    // 转换为日期->数量的映射
    const heatmapData = {};
    results.forEach(row => {
      heatmapData[row.date] = row.count;
    });

    return jsonResponse(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return errorResponse('Failed to fetch heatmap data', 500);
  }
});

export default app;
