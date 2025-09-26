-- 设置 UTF-8 编码
PRAGMA encoding = 'UTF-8';
PRAGMA foreign_keys = ON;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,  -- 改为昵称
    password_hash TEXT NOT NULL,  -- 添加密码字段
    email TEXT,
    created_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    is_admin INTEGER NOT NULL DEFAULT 0
);

-- 备忘录表
CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'PUBLIC',
    row_status TEXT NOT NULL DEFAULT 'NORMAL',
    created_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    display_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    pinned INTEGER NOT NULL DEFAULT 0,
    parent_id INTEGER,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES memos(id)
);

-- 资源表
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    size INTEGER,
    type TEXT,
    created_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 备忘录与资源关联表
CREATE TABLE IF NOT EXISTS memo_resources (
    memo_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,
    PRIMARY KEY (memo_id, resource_id),
    FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- API Token表
CREATE TABLE IF NOT EXISTS api_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_ts INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expires_ts INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_memos_creator_id ON memos(creator_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_ts ON memos(created_ts);
CREATE INDEX IF NOT EXISTS idx_memos_visibility ON memos(visibility);
-- 常用排序字段 display_ts 也加索引
CREATE INDEX IF NOT EXISTS idx_memos_display_ts ON memos(display_ts);
CREATE INDEX IF NOT EXISTS idx_resources_creator_id ON resources(creator_id);

-- 插入默认管理员用户（第一个注册用户将自动成为管理员）
