import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

/**
 * 将 sql.js 的 exec 结果转换为对象数组
 */
function rowsToObjects(result) {
  if (!result || !result.values || result.values.length === 0) return [];
  const { columns, values } = result;
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

/**
 * 获取数据库实例
 */
function getDb(req, res) {
  const db = req.app.get('db');
  if (!db) {
    res.status(500).json({ code: 500, data: null, message: '数据库未连接' });
    return null;
  }
  return db;
}

// ===================== POST /register =====================
// 用户注册
router.post('/register', async (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { username, password } = req.body;

    // 验证
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ code: 400, data: null, message: '用户名至少2个字符' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ code: 400, data: null, message: '密码至少6个字符' });
    }

    // 检查用户名是否已存在
    const existResult = db.exec('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existResult[0]?.values?.length) {
      return res.status(409).json({ code: 409, data: null, message: '用户名已存在' });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 生成新ID
    const maxIdResult = db.exec('SELECT MAX(id) as maxId FROM users');
    const newId = (maxIdResult[0]?.values[0]?.[0] ?? 0) + 1;

    db.run(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
      [newId, username.trim(), hashedPassword]
    );

    // 生成JWT Token
    const token = jwt.sign(
      { userId: newId, username: username.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      code: 201,
      data: {
        token,
        user: { id: newId, username: username.trim() },
      },
      message: '注册成功',
    });
  } catch (err) {
    console.error('注册失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '注册失败: ' + err.message });
  }
});

// ===================== POST /login =====================
// 用户登录
router.post('/login', async (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { username, password } = req.body;

    // 验证
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: '用户名和密码不能为空' });
    }

    // 查询用户
    const result = db.exec('SELECT * FROM users WHERE username = ?', [username.trim()]);
    const users = result.length > 0 ? rowsToObjects(result[0]) : [];

    if (users.length === 0) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }

    // 生成JWT Token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      data: {
        token,
        user: { id: user.id, username: user.username },
      },
      message: '登录成功',
    });
  } catch (err) {
    console.error('登录失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '登录失败: ' + err.message });
  }
});

// ===================== GET /me =====================
// 获取当前登录用户信息（需要登录）
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const result = db.exec('SELECT id, username, created_at FROM users WHERE id = ?', [req.user.userId]);
    const users = result.length > 0 ? rowsToObjects(result[0]) : [];

    if (users.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    res.json({ code: 200, data: users[0], message: 'success' });
  } catch (err) {
    console.error('获取用户信息失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '查询失败' });
  }
});

export default router;