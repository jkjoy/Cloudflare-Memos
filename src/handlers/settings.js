import { Hono } from 'hono';
import { requireAuth, requireAdmin, jsonResponse, errorResponse } from '../utils/auth';

const app = new Hono();

// 获取公开设置（无需权限）
app.get('/public', async (c) => {
  try {
    const db = c.env.DB;

    const stmt = db.prepare(`
      SELECT key, value
      FROM settings
      WHERE key IN ('site_title', 'site_avatar', 'allow_registration')
    `);

    const { results } = await stmt.all();

    const settings = {};
    results.forEach(row => {
      settings[row.key] = row.value;
    });

    return jsonResponse(settings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return errorResponse('Failed to fetch settings', 500);
  }
});

// 获取所有设置（需要管理员权限）
app.get('/', async (c) => {
  const authError = await requireAdmin(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;

    const stmt = db.prepare('SELECT * FROM settings ORDER BY key');
    const { results } = await stmt.all();

    return jsonResponse(results);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return errorResponse('Failed to fetch settings', 500);
  }
});

// 更新设置（需要管理员权限）
app.put('/:key', async (c) => {
  const authError = await requireAdmin(c);
  if (authError) return authError;

  try {
    const db = c.env.DB;
    const key = c.req.param('key');
    const { value } = await c.req.json();

    const stmt = db.prepare(`
      UPDATE settings
      SET value = ?, updated_ts = strftime('%s', 'now')
      WHERE key = ?
    `);

    await stmt.bind(value, key).run();

    return jsonResponse({ message: 'Setting updated successfully', key, value });
  } catch (error) {
    console.error('Error updating setting:', error);
    return errorResponse('Failed to update setting', 500);
  }
});

export default app;
