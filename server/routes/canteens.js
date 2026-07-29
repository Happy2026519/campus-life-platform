import { Router } from 'express';

const router = Router();

/**
 * 将 sql.js 的 exec 结果转换为对象数组
 * @param {{ columns: string[], values: any[][] }} result - exec 返回的单个结果集
 * @returns {object[]}
 */
function rowsToObjects(result) {
  if (!result || !result.values || result.values.length === 0) return [];
  const { columns, values } = result;
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    // tags 字段在数据库中存为 JSON 字符串，需转回数组
    if (typeof obj.tags === 'string') {
      try {
        obj.tags = JSON.parse(obj.tags);
      } catch {
        obj.tags = [];
      }
    }
    return obj;
  });
}

// GET /api/canteens —— 从数据库查询所有食堂数据
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    if (!db) {
      return res.status(500).json({
        code: 500,
        data: null,
        message: '数据库未连接',
      });
    }

    const result = db.exec('SELECT * FROM canteens');
    const canteens = result.length > 0 ? rowsToObjects(result[0]) : [];

    res.json({
      code: 200,
      data: canteens,
      message: 'success',
    });
  } catch (err) {
    console.error('查询食堂数据失败:', err.message);
    res.status(500).json({
      code: 500,
      data: null,
      message: '数据库查询失败',
    });
  }
});

export default router;