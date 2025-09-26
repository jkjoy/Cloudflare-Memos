import { Router } from 'itty-router';
import { requireAuth, jsonResponse, errorResponse, getRequestBody } from '../utils/auth';

// 简单的密码哈希函数（生产环境应该使用更安全的方法）
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证密码
async function verifyPassword(password, hashedPassword) {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

const router = Router({ base: '/api/v1/user' });

// 获取用户列表 - 需要权限
router.get('/', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    
    const stmt = db.prepare(`
      SELECT id, username, nickname, email, created_ts, is_admin
      FROM users
      ORDER BY created_ts ASC
    `);
    
    const { results } = await stmt.all();
    
    return jsonResponse(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Failed to fetch users', 500);
  }
});

// 创建用户
router.post('/', async (request) => {
  try {
    const db = request.env.DB;
    const body = await getRequestBody(request);
    
    if (!body.username || !body.nickname || !body.password) {
      return errorResponse('Username, nickname and password are required');
    }
    
    // 检查密码长度
    if (body.password.length < 6) {
      return errorResponse('Password must be at least 6 characters long');
    }
    
    // 检查是否是第一个用户
    const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = await userCountStmt.first();
    const isFirstUser = userCount.count === 0;

    // 若不是首个用户，需认证（管理员会话或服务端TOKEN）
    if (!isFirstUser) {
      const authError = await requireAuth(request);
      if (authError) return authError;
      if (request.user && !request.user.isAdmin) {
        return errorResponse('Only admin can create users', 403);
      }
    }
    
    // 检查用户名是否已存在
    const existingUserStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const existingUser = await existingUserStmt.bind(body.username).first();
    
    if (existingUser) {
      return errorResponse('Username already exists');
    }
    
    // 密码哈希
    const hashedPassword = await hashPassword(body.password);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, name, nickname, password_hash, email, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      body.username,
      body.nickname, // 同时填入name字段以兼容
      body.nickname,
      hashedPassword,
      body.email || null,
      isFirstUser ? 1 : 0  // 第一个用户自动成为管理员
    ).run();
    
    return jsonResponse({
      id: result.meta.last_row_id,
      username: body.username,
      nickname: body.nickname,
      email: body.email,
      is_admin: isFirstUser,
      message: isFirstUser ? 'First user created as administrator' : 'User created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse('Failed to create user', 500);
  }
});

// 用户登录
router.post('/login', async (request) => {
  try {
    const db = request.env.DB;
    const body = await getRequestBody(request);
    
    if (!body.username || !body.password) {
      return errorResponse('Username and password are required');
    }
    
    // 查找用户
    const stmt = db.prepare(`
      SELECT id, username, nickname, password_hash, email, is_admin
      FROM users
      WHERE username = ?
    `);
    
    const user = await stmt.bind(body.username).first();
    
    if (!user) {
      return errorResponse('Invalid username or password', 401);
    }
    
    // 验证密码
    const isValidPassword = await verifyPassword(body.password, user.password_hash);
    
    if (!isValidPassword) {
      return errorResponse('Invalid username or password', 401);
    }
    
    // 生成简单的登录会话信息（生产环境应该使用JWT）
    const sessionData = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      isAdmin: Boolean(user.is_admin),
      loginTime: Math.floor(Date.now() / 1000)
    };
    
    return jsonResponse({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        is_admin: Boolean(user.is_admin)
      },
      session: sessionData
    });
  } catch (error) {
    console.error('Error during login:', error);
    return errorResponse('Login failed', 500);
  }
});

// 修改密码 - 需要权限
router.put('/:id/password', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const { id } = request.params;
    const body = await getRequestBody(request);
    
    if (!body.currentPassword || !body.newPassword) {
      return errorResponse('Current password and new password are required');
    }
    
    // 检查新密码长度
    if (body.newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters long');
    }
    
    // 获取用户当前密码
    const userStmt = db.prepare('SELECT password_hash FROM users WHERE id = ?');
    const user = await userStmt.bind(id).first();
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    // 验证当前密码
    const isValidPassword = await verifyPassword(body.currentPassword, user.password_hash);
    if (!isValidPassword) {
      return errorResponse('Current password is incorrect', 400);
    }
    
    // 生成新密码哈希
    const newHashedPassword = await hashPassword(body.newPassword);
    
    // 更新密码
    const updateStmt = db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_ts = ?
      WHERE id = ?
    `);
    
    const result = await updateStmt.bind(
      newHashedPassword,
      Math.floor(Date.now() / 1000),
      id
    ).run();
    
    if (result.changes === 0) {
      return errorResponse('Failed to update password', 500);
    }
    
    return jsonResponse({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return errorResponse('Failed to update password', 500);
  }
});

// 更新用户信息 - 需要权限
router.put('/:id', async (request) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  
  try {
    const db = request.env.DB;
    const { id } = request.params;
    const body = await getRequestBody(request);
    
    if (!body.nickname && !body.email) {
      return errorResponse('At least nickname or email must be provided');
    }
    
    // 构建动态更新SQL
    const updateFields = [];
    const updateValues = [];
    
    if (body.nickname) {
      updateFields.push('nickname = ?');
      updateValues.push(body.nickname);
    }
    
    if (body.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(body.email || null);
    }
    
    updateFields.push('updated_ts = ?');
    updateValues.push(Math.floor(Date.now() / 1000));
    
    updateValues.push(id);
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);
    
    const result = await stmt.bind(...updateValues).run();
    
    if (result.changes === 0) {
      return errorResponse('User not found', 404);
    }
    
    // 返回更新后的用户信息
    const userStmt = db.prepare('SELECT id, username, nickname, email, is_admin FROM users WHERE id = ?');
    const user = await userStmt.bind(id).first();
    
    return jsonResponse({
      ...user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse('Failed to update user', 500);
  }
});

export async function handleUserRoutes(request) {
  return router.handle(request);
}
