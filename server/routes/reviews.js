import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * 将 sql.js 的 exec 结果转换为对象数组
 * 自动处理 Uint8Array（sql.js 返回 UTF-8 编码的二进制数据）
 */
function rowsToObjects(result) {
  if (!result || !result.values || result.values.length === 0) return [];
  const { columns, values } = result;
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      const val = row[i];
      // sql.js 可能以 Uint8Array 形式返回 TEXT 类型，需要转为字符串
      if (val instanceof Uint8Array) {
        obj[col] = new TextDecoder().decode(val);
      } else {
        obj[col] = val;
      }
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
// 获取评价列表（支持分页和按食堂/商品筛选）
router.get('/', (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const canteenId = req.query.canteen_id ? parseInt(req.query.canteen_id, 10) : null;
    const itemId = req.query.item_id ? parseInt(req.query.item_id, 10) : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    let countSql = 'SELECT COUNT(*) as cnt FROM reviews';
    let dataSql = 'SELECT * FROM reviews';
    const conditions = [];
    const params = [];

    if (canteenId) {
      conditions.push('canteen_id = ?');
      params.push(canteenId);
    }
    if (itemId) {
      conditions.push('item_id = ?');
      params.push(itemId);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      countSql += where;
      dataSql += where;
    }

    dataSql += ' ORDER BY time DESC LIMIT ? OFFSET ?';

    // 查询总数
    const countResult = db.exec(countSql, params);
    const total = countResult[0]?.values[0]?.[0] ?? 0;

    // 查询分页数据
    const dataResult = db.exec(dataSql, [...params, limit, offset]);
    const reviews = dataResult.length > 0 ? rowsToObjects(dataResult[0]) : [];

    res.json({
      code: 200,
      data: {
        reviews,
        total,
        page,
        limit,
      },
      message: 'success',
    });
  } catch (err) {
    console.error('查询评价列表失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' });
  }
});

// ===================== GET /:id =====================
// 获取单条评价详情
router.get('/:id', (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的评价ID' });
    }

    const result = db.exec('SELECT * FROM reviews WHERE id = ?', [id]);
    const reviews = result.length > 0 ? rowsToObjects(result[0]) : [];

    if (reviews.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '评价不存在' });
    }

    res.json({ code: 200, data: reviews[0], message: 'success' });
  } catch (err) {
    console.error('查询评价详情失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' });
  }
});

// ===================== POST / =====================
// 提交新评价（需要登录）
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { canteen_id, item_id, content, rating } = req.body;

    // 验证：必须有 canteen_id 或 item_id 之一
    if (!canteen_id && !item_id) {
      return res.status(400).json({ code: 400, data: null, message: '食堂ID或商品ID不能为空' });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '评价内容不能为空' });
    }
    if (content.length > 500) {
      return res.status(400).json({ code: 400, data: null, message: '评价内容不能超过500字' });
    }
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ code: 400, data: null, message: '评分必须在1-5之间' });
    }

    // 检查食堂或商品是否存在
    if (canteen_id) {
      const canteenResult = db.exec('SELECT id FROM canteens WHERE id = ?', [canteen_id]);
      if (!canteenResult[0]?.values?.length) {
        return res.status(404).json({ code: 404, data: null, message: '食堂不存在' });
      }
    }
    if (item_id) {
      const itemResult = db.exec('SELECT id FROM items WHERE id = ?', [item_id]);
      if (!itemResult[0]?.values?.length) {
        return res.status(404).json({ code: 404, data: null, message: '商品不存在' });
      }
    }

    // 生成新ID
    const maxIdResult = db.exec('SELECT MAX(id) as maxId FROM reviews');
    const newId = (maxIdResult[0]?.values[0]?.[0] ?? 0) + 1;

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const userId = req.user.userId;
    const username = req.user.username;

    db.run(
      'INSERT INTO reviews (id, canteen_id, item_id, username, content, rating, time, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, canteen_id || null, item_id || null, username, content.trim(), ratingNum, now, userId]
    );

    // 查询刚插入的完整数据
    const insertResult = db.exec('SELECT * FROM reviews WHERE id = ?', [newId]);
    const newReview = rowsToObjects(insertResult[0])[0];

    res.status(201).json({ code: 201, data: newReview, message: '评价成功' });
  } catch (err) {
    console.error('提交评价失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

// ===================== PUT /:id =====================
// 修改评价（需要登录 + 验证是否本人）
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的评价ID' });
    }

    // 查询评价是否存在
    const existResult = db.exec('SELECT * FROM reviews WHERE id = ?', [id]);
    const existing = existResult[0]?.values?.length ? rowsToObjects(existResult[0])[0] : null;

    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '评价不存在' });
    }

    // 权限验证：只有发布者可以修改
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权修改此评价' });
    }

    const { content, rating } = req.body;

    // 构建动态更新
    const updates = [];
    const updateParams = [];

    if (content !== undefined) {
      if (content.trim().length === 0) {
        return res.status(400).json({ code: 400, data: null, message: '评价内容不能为空' });
      }
      if (content.length > 500) {
        return res.status(400).json({ code: 400, data: null, message: '评价内容不能超过500字' });
      }
      updates.push('content = ?');
      updateParams.push(content.trim());
    }

    if (rating !== undefined) {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ code: 400, data: null, message: '评分必须在1-5之间' });
      }
      updates.push('rating = ?');
      updateParams.push(ratingNum);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '没有需要更新的字段' });
    }

    db.run(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, [...updateParams, id]);

    // 查询更新后的数据
    const updatedResult = db.exec('SELECT * FROM reviews WHERE id = ?', [id]);
    const updatedReview = rowsToObjects(updatedResult[0])[0];

    res.json({ code: 200, data: updatedReview, message: '修改成功' });
  } catch (err) {
    console.error('修改评价失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

// ===================== DELETE /:id =====================
// 删除评价（需要登录 + 验证是否本人）
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的评价ID' });
    }

    // 查询评价是否存在
    const existResult = db.exec('SELECT * FROM reviews WHERE id = ?', [id]);
    const existing = existResult[0]?.values?.length ? rowsToObjects(existResult[0])[0] : null;

    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '评价不存在' });
    }

    // 权限验证：只有发布者可以删除
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权删除此评价' });
    }

    db.run('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({ code: 200, data: null, message: '删除成功' });
  } catch (err) {
    console.error('删除评价失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

export default router;