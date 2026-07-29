import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/init.js';
import { getConnection } from './database/connection.js';
import canteensRouter from './routes/canteens.js';
import itemsRouter from './routes/items.js';
import lostFoundRouter from './routes/lost-found.js';
import reviewsRouter from './routes/reviews.js';
import authRouter from './routes/auth.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由挂载
app.use('/api/canteens', canteensRouter);
app.use('/api/items', itemsRouter);
app.use('/api/lost-found', lostFoundRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);

// 数据库初始化 & 启动服务器
async function start() {
  try {
    await initDatabase();
    // 将数据库实例挂载到 app 上，方便路由文件使用
    app.set('db', await getConnection());
    console.log('[服务器] 数据库初始化成功');
  } catch (err) {
    console.error('[服务器] 数据库初始化失败:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[服务器] 后端运行在 http://localhost:${PORT}`);
  });
}

start();