import { Router } from 'express';

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

// ===================== POST /summarize-reviews =====================
// 生成食堂或商品评价的AI总结
router.post('/summarize-reviews', async (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { canteen_id, item_id } = req.body;

    // 校验：必须有 canteen_id 或 item_id
    if (!canteen_id && !item_id) {
      return res.status(400).json({ code: 400, data: null, message: 'canteen_id 或 item_id 不能为空' });
    }

    // 判断总结类型
    const isItemReview = !!item_id;

    // 查询该食堂或商品最近20条评价
    let sql;
    let params;
    if (isItemReview) {
      sql = 'SELECT content, rating FROM reviews WHERE item_id = ? ORDER BY time DESC LIMIT 20';
      params = [item_id];
    } else {
      sql = 'SELECT content, rating FROM reviews WHERE canteen_id = ? ORDER BY time DESC LIMIT 20';
      params = [canteen_id];
    }

    const result = db.exec(sql, params);
    const reviews = result.length > 0 ? rowsToObjects(result[0]) : [];

    // 如果评价数量为0
    if (reviews.length === 0) {
      const emptyMsg = isItemReview ? '该商品暂无评价' : '该食堂暂无评价';
      return res.json({ code: 200, data: { summary: emptyMsg }, message: 'success' });
    }

    // 将评价内容拼接成文本
    const reviewText = reviews
      .map((r) => `评分${r.rating}星：${r.content}`)
      .join('\n');

    // 构造 DeepSeek API 请求
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ code: 500, data: null, message: '未配置 DeepSeek API Key' });
    }

    // 根据类型选择提示词
    const systemPrompt = isItemReview
      ? (
        '你是一个校园二手交易助手。请根据以下商品评价，用3句话总结：\n' +
        '第1句：整体口碑如何（买家普遍满意还是有意见）\n' +
        '第2句：商品质量或成色如何\n' +
        '第3句：卖家的服务和性价比如何\n\n' +
        '请直接输出3句话总结，不要加标题和编号。每句话不超过40字。'
      )
      : (
        '你是一个校园生活助手。请根据以下食堂评价，用3句话总结：\n' +
        '第1句：整体口碑如何（学生们普遍满意还是有怨言）\n' +
        '第2句：最受欢迎或最常被提到的菜品是什么\n' +
        '第3句：价格水平如何\n\n' +
        '请直接输出3句话总结，不要加标题和编号。每句话不超过40字。'
      );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const apiResponse = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `以下是评价：\n${reviewText}` },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      console.error('DeepSeek API 调用失败:', apiResponse.status, apiResponse.statusText);
      return res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' });
    }

    const data = await apiResponse.json();
    const summary = data.choices?.[0]?.message?.content || '';

    res.json({ code: 200, data: { summary }, message: 'success' });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ code: 504, data: null, message: 'AI服务请求超时，请稍后重试' });
    }
    console.error('AI总结生成失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' });
  }
});

// ===================== POST /generate-description =====================
// AI生成二手商品描述
router.post('/generate-description', async (req, res) => {
  try {
    const { title, condition, price, usage } = req.body;

    // 验证必填字段
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '商品名称不能为空' });
    }
    const priceNum = parseFloat(price);
    if (price === undefined || price === null || isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ code: 400, data: null, message: '价格必填且大于0' });
    }

    // 构造 DeepSeek API 请求
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ code: 500, data: null, message: '未配置 DeepSeek API Key' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const userContentParts = [`商品名称：${title.trim()}`];
    if (condition) userContentParts.push(`成色：${condition}`);
    userContentParts.push(`售价：${priceNum}元`);
    if (usage) userContentParts.push(`使用情况：${usage}`);

    const apiResponse = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个校园二手交易平台的助手。请根据用户提供的商品信息，生成一段吸引人的商品描述。\n\n' +
              '要求：\n' +
              '- 语气活泼、亲切，符合大学生风格\n' +
              '- 突出商品的核心卖点\n' +
              '- 提到原价和现价的对比（如果价格合理的话）\n' +
              '- 适当使用emoji\n' +
              '- 长度控制在50-100字\n' +
              '- 直接输出描述文案，不要加标题',
          },
          {
            role: 'user',
            content: userContentParts.join('\n'),
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      console.error('DeepSeek API 调用失败:', apiResponse.status, apiResponse.statusText);
      return res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' });
    }

    const data = await apiResponse.json();
    const description = data.choices?.[0]?.message?.content || '';

    res.json({ code: 200, data: { description }, message: 'success' });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ code: 504, data: null, message: 'AI服务请求超时，请稍后重试' });
    }
    console.error('AI商品描述生成失败:', err.message);
    res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' });
  }
});

export default router;