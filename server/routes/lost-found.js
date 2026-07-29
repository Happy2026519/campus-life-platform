import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

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

// ===================== GET / =====================
// 获取失物招领列表（支持类型筛选、关键词搜索、分页）
router.get('/', (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { type, keyword } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    const params = [];

    if (type) {
      const validTypes = ['丢失', '捡到'];
      if (validTypes.includes(type)) {
        conditions.push('type = ?');
        params.push(type);
      }
    }

    if (keyword) {
      conditions.push('(title LIKE ? OR location LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // 查询总数
    const countSql = 'SELECT COUNT(*) as cnt FROM lost_found' + where;
    const countResult = db.exec(countSql, params);
    const total = countResult[0]?.values[0]?.[0] ?? 0;

    // 查询分页数据，关联 users 表获取发布者用户名
    const dataSql =
      'SELECT l.*, u.username AS publisher_name FROM lost_found l ' +
      'LEFT JOIN users u ON l.user_id = u.id' +
      where +
      ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    const dataResult = db.exec(dataSql, [...params, limit, offset]);
    const items = dataResult.length > 0 ? rowsToObjects(dataResult[0]) : [];

    res.json({
      code: 200,
      data: {
        items,
        total,
        page,
        limit,
      },
      message: 'success',
    });
  } catch (err) {
    console.error('查询失物招领列表失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' });
  }
});

// ===================== GET /:id =====================
// 获取失物招领详情
router.get('/:id', (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的ID' });
    }

    const sql =
      'SELECT l.*, u.username AS publisher_name FROM lost_found l ' +
      'LEFT JOIN users u ON l.user_id = u.id WHERE l.id = ?';
    const result = db.exec(sql, [id]);
    const items = result.length > 0 ? rowsToObjects(result[0]) : [];

    if (items.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '信息不存在' });
    }

    res.json({ code: 200, data: items[0], message: 'success' });
  } catch (err) {
    console.error('查询失物招领详情失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' });
  }
});

// ===================== POST / =====================
// 发布失物招领信息（需要登录）
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { type, title, location, date, description, contact } = req.body;

    // 验证
    const validTypes = ['丢失', '捡到'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ code: 400, data: null, message: '类型必填，必须为"丢失"或"捡到"' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '标题不能为空' });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '描述不能为空' });
    }

    // 生成新ID
    const maxIdResult = db.exec('SELECT MAX(id) as maxId FROM lost_found');
    const newId = (maxIdResult[0]?.values[0]?.[0] ?? 0) + 1;

    const user_id = req.user.userId;
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const dateStr = date || now.split(' ')[0];

    db.run(
      'INSERT INTO lost_found (id, type, title, location, time, description, contact, status, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, type, title.trim(), (location || '').trim(), dateStr, description.trim(), (contact || '').trim(), '待认领', user_id, now]
    );

    // 查询刚插入的完整数据
    const insertResult = db.exec('SELECT * FROM lost_found WHERE id = ?', [newId]);
    const newItem = rowsToObjects(insertResult[0])[0];

    res.status(201).json({ code: 201, data: newItem, message: '发布成功' });
  } catch (err) {
    console.error('发布失物招领失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

// ===================== PUT /:id =====================
// 修改失物招领信息（需要登录 + 验证是否本人）
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的ID' });
    }

    // 查询信息是否存在
    const existResult = db.exec('SELECT * FROM lost_found WHERE id = ?', [id]);
    const existing = existResult[0]?.values?.length ? rowsToObjects(existResult[0])[0] : null;

    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '信息不存在' });
    }

    // 权限验证：只有发布者可以修改
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权修改此信息' });
    }

    const { type, title, location, date, description, contact, status } = req.body;

    // 构建动态更新
    const updates = [];
    const updateParams = [];

    if (type !== undefined) {
      const validTypes = ['丢失', '捡到'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ code: 400, data: null, message: '类型必须为"丢失"或"捡到"' });
      }
      updates.push('type = ?');
      updateParams.push(type);
    }

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return res.status(400).json({ code: 400, data: null, message: '标题不能为空' });
      }
      updates.push('title = ?');
      updateParams.push(title.trim());
    }

    if (location !== undefined) {
      updates.push('location = ?');
      updateParams.push(location.trim());
    }

    if (date !== undefined) {
      updates.push('time = ?');
      updateParams.push(date);
    }

    if (description !== undefined) {
      if (description.trim().length === 0) {
        return res.status(400).json({ code: 400, data: null, message: '描述不能为空' });
      }
      updates.push('description = ?');
      updateParams.push(description.trim());
    }

    if (contact !== undefined) {
      updates.push('contact = ?');
      updateParams.push(contact.trim());
    }

    if (status !== undefined) {
      const validStatuses = ['待认领', '已认领', '已归还'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ code: 400, data: null, message: '状态必须为"待认领/已认领/已归还"之一' });
      }
      updates.push('status = ?');
      updateParams.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '没有需要更新的字段' });
    }

    db.run(`UPDATE lost_found SET ${updates.join(', ')} WHERE id = ?`, [...updateParams, id]);

    // 查询更新后的数据
    const updatedResult = db.exec('SELECT * FROM lost_found WHERE id = ?', [id]);
    const updatedItem = rowsToObjects(updatedResult[0])[0];

    res.json({ code: 200, data: updatedItem, message: '修改成功' });
  } catch (err) {
    console.error('修改失物招领失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

// ===================== DELETE /:id =====================
// 删除失物招领信息（真删除，需要登录 + 验证是否本人）
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的ID' });
    }

    // 查询信息是否存在
    const existResult = db.exec('SELECT * FROM lost_found WHERE id = ?', [id]);
    const existing = existResult[0]?.values?.length ? rowsToObjects(existResult[0])[0] : null;

    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '信息不存在' });
    }

    // 权限验证：只有发布者可以删除
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权删除此信息' });
    }

    db.run('DELETE FROM lost_found WHERE id = ?', [id]);

    res.json({ code: 200, data: null, message: '删除成功' });
  } catch (err) {
    console.error('删除失物招领失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

export default router;