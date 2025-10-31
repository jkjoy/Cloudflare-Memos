import { getMemoDetailHTML } from '../pages/memoDetailPage.js';
import { getProfileHTML } from '../pages/profilePage.js';
import { getUserPageHTML } from '../pages/userPage.js';
import { getHomePageHTML } from '../pages/homePage.js';
import { getLoginPageHTML } from '../pages/loginPage.js';
import { getRegisterPageHTML } from '../pages/registerPage.js';
import { getTagPageHTML } from '../pages/tagPage.js';
import { getSearchPageHTML } from '../pages/searchPage.js';
import { getSettingsHTML } from '../pages/settingsPage.js';
import { getEditPageHTML } from '../pages/editPage.js';
import { getExplorePageHTML } from '../pages/explorePage.js';

export async function handleWebRoutes(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/') {
    return new Response(await getHomePageHTML(request, env), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (path === '/login') {
    return new Response(await getLoginPageHTML(request, env), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (path === '/register') {
    return new Response(await getRegisterPageHTML(request, env), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (path === '/profile') {
    return new Response(await getProfileHTML(request, env), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (path === '/settings') {
    return new Response(await getSettingsHTML(request, env), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (path === '/search') {
    return new Response(await getSearchPageHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (path === '/explore') {
    return new Response(await getExplorePageHTML(request, env), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 标签页面路由：/tag/:name
  if (path.startsWith('/tag/')) {
    const tagName = path.split('/')[2];
    if (tagName) {
      return new Response(await getTagPageHTML(request, env, tagName), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }

  // 用户个人页面路由：/user/:id
  if (path.startsWith('/user/')) {
    const userId = path.split('/')[2];
    if (userId && /^\d+$/.test(userId)) {
      return new Response(await getUserPageHTML(request, env, userId), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }

  if (path.startsWith('/m/')) {
    const memoId = path.split('/')[2];
    if (memoId && /^\d+$/.test(memoId)) {
      return new Response(await getMemoDetailHTML(request, env, memoId), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    // 非法或缺失的ID，返回404
    return new Response(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>未找到备忘录</title></head><body><div style="padding:20px;text-align:center;"><h1>未找到备忘录</h1><p>请求的备忘录ID无效。</p><a href="/">返回首页</a></div></body></html>`, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 编辑备忘录页面路由：/edit/:id
  if (path.startsWith('/edit/')) {
    const memoId = path.split('/')[2];
    if (memoId && /^\d+$/.test(memoId)) {
      return new Response(await getEditPageHTML(request, env), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    // 非法或缺失的ID，返回404
    return new Response(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>未找到备忘录</title></head><body><div style="padding:20px;text-align:center;"><h1>未找到备忘录</h1><p>请求的备忘录ID无效。</p><a href="/">返回首页</a></div></body></html>`, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
