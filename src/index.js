import { Router } from 'itty-router';
import { handleMemoRoutes } from './handlers/memos';
import { handleUserRoutes } from './handlers/users';
import { handleResourceRoutes } from './handlers/resources';
import { handleWebRoutes } from './handlers/web';
import { corsHeaders, handleCORS } from './utils/cors';

const router = Router();

// CORS 预检请求
router.options('*', handleCORS);

// API 路由
router.all('/api/v1/memo/*', handleMemoRoutes);
router.all('/api/v1/memo', handleMemoRoutes);
router.all('/api/v1/user/*', handleUserRoutes);
router.all('/api/v1/user', handleUserRoutes);
router.post('/api/v1/user/login', handleUserRoutes);  // 登录路由
router.all('/api/v1/resource/*', handleResourceRoutes);
router.all('/api/v1/resourceList', handleResourceRoutes);

// 前端页面路由
router.get('/', handleWebRoutes);
router.get('/login', handleWebRoutes);
router.get('/register', handleWebRoutes);
router.get('/profile', handleWebRoutes);
router.get('/user/:id', handleWebRoutes);
router.get('/m/:id', handleWebRoutes);

// 404 处理
router.all('*', () => new Response('Not Found', { 
  status: 404,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    ...corsHeaders
  }
}));

export default {
  async fetch(request, env, ctx) {
    try {
      // 为所有处理器提供环境变量
      request.env = env;
      
      const response = await router.handle(request);
      
      // 确保所有响应都包含CORS头
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          ...corsHeaders
        }
      });
      
      return newResponse;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...corsHeaders
        }
      });
    }
  }
};