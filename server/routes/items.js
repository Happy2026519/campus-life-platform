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
    // images 字段在数据库中存为 JSON 字符串，需转回数组
    if (typeof obj.images === 'string') {
      try {
        obj.images = JSON.parse(obj.images);
      } catch {
        obj.images = [];
      }
    }
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
// 获取商品列表（支持关键词搜索、分类筛选、状态筛选、分页）
router.get('/', (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { keyword, category, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      const validCategories = ['教材', '电子', '生活', '其他'];
      if (validCategories.includes(category)) {
        conditions.push('category = ?');
        params.push(category);
      }
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    } else {
      // 默认只显示"在售"商品
      conditions.push("status = '在售'");
    }

    const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // 查询总数
    const countSql = 'SELECT COUNT(*) as cnt FROM items' + where;
    const countResult = db.exec(countSql, params);
    const total = countResult[0]?.values[0]?.[0] ?? 0;

    // 查询分页数据，关联 users 表获取发布者用户名
    const dataSql =
      'SELECT i.*, u.username AS seller_name FROM items i ' +
      'LEFT JOIN users u ON i.user_id = u.id' +
      where +
      ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
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
    console.error('查询商品列表失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' });
  }
});

// ===================== GET /:id =====================
// 获取商品详情（关联 users 表查询发布者用户名）
router.get('/:id', (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的商品ID' });
    }

    const sql =
      'SELECT i.*, u.username AS seller_name FROM items i ' +
      'LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ?';
    const result = db.exec(sql, [id]);
    const items = result.length > 0 ? rowsToObjects(result[0]) : [];

    if (items.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' });
    }

    res.json({ code: 200, data: items[0], message: 'success' });
  } catch (err) {
    console.error('查询商品详情失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' });
  }
});

// ===================== POST / =====================
// 发布新商品（需要登录）
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { title, description, price, category, images, contact } = req.body;

    // 验证
    if (!title || title.trim().length < 2 || title.trim().length > 30) {
      return res.status(400).json({ code: 400, data: null, message: '标题必填，2-30字' });
    }

    const priceNum = parseFloat(price);
    if (price === undefined || price === null || isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ code: 400, data: null, message: '价格必填且大于0' });
    }

    const validCategories = ['教材', '电子', '生活', '其他'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ code: 400, data: null, message: '分类必填，必须为"教材/电子/生活/其他"之一' });
    }

    // 生成新ID
    const maxIdResult = db.exec('SELECT MAX(id) as maxId FROM items');
    const newId = (maxIdResult[0]?.values[0]?.[0] ?? 0) + 1;

    const userId = req.user.userId;
    const sellerName = req.user.username;
    const imagesStr = images ? JSON.stringify(images) : '[]';

    db.run(
      'INSERT INTO items (id, title, description, price, category, images, contact, seller, user_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\', \'localtime\'))',
      [newId, title.trim(), (description || '').trim(), priceNum, category, imagesStr, (contact || '').trim(), sellerName, userId, '在售']
    );

    // 查询刚插入的完整数据
    const insertResult = db.exec('SELECT * FROM items WHERE id = ?', [newId]);
    const newItem = rowsToObjects(insertResult[0])[0];

    res.status(201).json({ code: 201, data: newItem, message: '发布成功' });
  } catch (err) {
    console.error('发布商品失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

// ===================== PUT /:id =====================
// 修改商品（需要登录，仅本人可修改）
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的商品ID' });
    }

    // 查询商品是否存在
    const existResult = db.exec('SELECT * FROM items WHERE id = ?', [id]);
    const existing = existResult[0]?.values?.length ? rowsToObjects(existResult[0])[0] : null;

    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' });
    }

    // 权限验证：只有发布者可以修改
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权修改此商品' });
    }

    const { title, description, price, category, status, images, contact } = req.body;

    // 构建动态更新
    const updates = [];
    const updateParams = [];

    if (title !== undefined) {
      if (title.trim().length < 2 || title.trim().length > 30) {
        return res.status(400).json({ code: 400, data: null, message: '标题必填，2-30字' });
      }
      updates.push('title = ?');
      updateParams.push(title.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      updateParams.push(description.trim());
    }

    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ code: 400, data: null, message: '价格必须大于0' });
      }
      updates.push('price = ?');
      updateParams.push(priceNum);
    }

    if (category !== undefined) {
      const validCategories = ['教材', '电子', '生活', '其他'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ code: 400, data: null, message: '分类必须为"教材/电子/生活/其他"之一' });
      }
      updates.push('category = ?');
      updateParams.push(category);
    }

    if (status !== undefined) {
      const validStatuses = ['在售', '已售出'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ code: 400, data: null, message: '状态必须为"在售"或"已售出"' });
      }
      updates.push('status = ?');
      updateParams.push(status);
    }

    if (images !== undefined) {
      updates.push('images = ?');
      updateParams.push(JSON.stringify(images));
    }

    if (contact !== undefined) {
      updates.push('contact = ?');
      updateParams.push(contact.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '没有需要更新的字段' });
    }

    db.run(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, [...updateParams, id]);

    // 查询更新后的数据
    const updatedResult = db.exec('SELECT * FROM items WHERE id = ?', [id]);
    const updatedItem = rowsToObjects(updatedResult[0])[0];

    res.json({ code: 200, data: updatedItem, message: '修改成功' });
  } catch (err) {
    console.error('修改商品失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

// ===================== DELETE /:id =====================
// 下架商品（软删除：将 status 改为 "已售出"）（需要登录，仅本人可操作）
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的商品ID' });
    }

    // 查询商品是否存在
    const existResult = db.exec('SELECT * FROM items WHERE id = ?', [id]);
    const existing = existResult[0]?.values?.length ? rowsToObjects(existResult[0])[0] : null;

    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' });
    }

    // 权限验证：只有发布者可以下架
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权下架此商品' });
    }

    // 软删除：将 status 改为 "已售出"
    db.run("UPDATE items SET status = '已售出' WHERE id = ?", [id]);

    res.json({ code: 200, data: null, message: '下架成功' });
  } catch (err) {
    console.error('下架商品失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: '数据库操作失败' });
  }
});

export default router;