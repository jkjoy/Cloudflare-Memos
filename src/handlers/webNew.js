// 新的 Web 路由处理器 - 重构版
// 将原来的 3490 行拆分成多个模块化文件

import { getHomePageHTML } from '../pages/homePage.js';
import { getLoginPageHTML } from '../pages/loginPage.js';
import { getRegisterPageHTML } from '../pages/registerPage.js';
// TODO: 添加更多页面导入
// import { getProfilePageHTML } from '../pages/profilePage.js';
// import { getUserPageHTML } from '../pages/userPage.js';
// import { getMemoDetailPageHTML } from '../pages/memoDetailPage.js';

export async function handleWebRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 首页
  if (path === '/') {
    return new Response(await getHomePageHTML(request), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 登录页
  if (path === '/login') {
    return new Response(getLoginPageHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 注册页
  if (path === '/register') {
    return new Response(getRegisterPageHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 个人资料页
  if (path === '/profile') {
    // TODO: 实现 profilePage.js
    return new Response('个人资料页 - 开发中', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 用户页面
  if (path.startsWith('/user/')) {
    // TODO: 实现 userPage.js
    return new Response('用户页面 - 开发中', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // Memo 详情页
  if (path.startsWith('/m/')) {
    // TODO: 实现 memoDetailPage.js
    return new Response('Memo 详情页 - 开发中', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 404
  return new Response('Not Found', { status: 404 });
}
