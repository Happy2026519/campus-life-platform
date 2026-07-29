import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, 'campus.db');

let db = null;

/**
 * 获取数据库连接（单例模式）
 * 首次调用时初始化 sql.js 并加载/创建数据库文件
 */
export async function getConnection() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    // 加载已有的数据库文件
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    // 创建新的数据库
    db = new SQL.Database();
  }

  return db;
}

/**
 * 将数据库保存到磁盘文件
 */
export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}