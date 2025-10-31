import { Hono } from 'hono';
import { cors } from 'hono/cors';
import memosApp from './handlers/memos';
import usersApp from './handlers/users';
import resourcesApp from './handlers/resources';
import settingsApp from './handlers/settings';
import rssApp from './handlers/rss';
import { handleWebRoutes } from './handlers/web';
import faviconData from './favicon.ico';

const app = new Hono();

// CORS 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600,
  credentials: true,
}));

// 挂载 API 路由
app.route('/api/v1/memo', memosApp);
app.route('/api/v1/user', usersApp);
app.route('/api/v1/resource', resourcesApp);
app.route('/api/v1/settings', settingsApp);

// RSS 路由
app.route('/', rssApp);

// Favicon 路由
app.get('/favicon.ico', (c) => {
  return new Response(faviconData, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});

// 前端页面路由
app.get('/', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/login', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/register', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/profile', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/settings', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/search', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/explore', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/tag/:name', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

// Redirect uppercase /Profile to lowercase /profile
app.get('/Profile', async (c) => {
  return c.redirect('/profile', 301);
});

app.get('/user/:id', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/m/:id', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

app.get('/edit/:id', async (c) => {
  return await handleWebRoutes(c.req.raw, c.env);
});

// 直接文件访问路由：/:filename (例如: /2_1761140800100.jpeg)
// 这个路由需要放在最后，作为通配符处理文件请求
app.get('/:filename', async (c) => {
  const filename = c.req.param('filename');

  // 检查文件名格式是否匹配：用户ID_时间戳.后缀
  if (filename && filename.match(/^\d+_\d+\.\w+$/)) {
    try {
      const bucket = c.env.BUCKET;

      // 从 R2 获取文件
      const object = await bucket.get(filename);

      if (!object) {
        return c.text('File not found', 404);
      }

      // 获取文件的 MIME 类型
      const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

      // 返回文件内容
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      console.error('Error serving file:', error);
      return c.text('Error serving file', 500);
    }
  }

  // 如果不匹配文件格式，返回 404
  return c.text('Not Found', 404);
});

// 404 处理
app.notFound((c) => {
  return c.text('Not Found', 404);
});

// 全局错误处理
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

export default app;