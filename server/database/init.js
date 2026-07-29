import { getConnection, saveDatabase } from './connection.js';

/**
 * 初始化数据库：创建表结构并导入初始数据
 */
export async function initDatabase() {
  const db = await getConnection();

  // ========== 创建表结构 ==========

  // 开启外键约束和UTF-8编码
  db.run('PRAGMA foreign_keys = OFF');
  db.run('PRAGMA encoding = "UTF-8"');

  // ===== 处理 reviews 表迁移：旧表 canteen_id NOT NULL → 新表可空 =====
  // SQLite 不支持 ALTER COLUMN，需要重建表
  // 先检查 reviews 表是否存在
  const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'");
  const tableExists = tableCheck.length > 0 && tableCheck[0].values.length > 0;

  if (tableExists) {
    // 检查当前 reviews 表结构
    const tableInfo = db.exec("PRAGMA table_info(reviews)");
    const canteenCol = tableInfo[0].values.find(row => row[1] === 'canteen_id');
    const hasItemIdCol = tableInfo[0].values.find(row => row[1] === 'item_id');
    // 如果 canteen_id 是 NOT NULL，或者没有 item_id 列，需要迁移
    const needsMigration = (canteenCol && canteenCol[3] === 1) || !hasItemIdCol;

    if (needsMigration) {
      // 创建新表（canteen_id 可空）
      db.run(`
        CREATE TABLE reviews_new (
          id INTEGER PRIMARY KEY,
          canteen_id INTEGER,
          item_id INTEGER,
          username TEXT NOT NULL,
          content TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
          time TEXT NOT NULL,
          user_id INTEGER DEFAULT 1
        )
      `);
      // 拷贝旧数据
      db.run('INSERT INTO reviews_new (id, canteen_id, item_id, username, content, rating, time, user_id) SELECT id, canteen_id, NULL, username, content, rating, time, COALESCE(user_id, 1) FROM reviews');
      // 删除旧表
      db.run('DROP TABLE reviews');
      // 重命名新表
      db.run('ALTER TABLE reviews_new RENAME TO reviews');
    }
    // 如果不需要迁移，表结构已经正确，无需操作
  } else {
    // 新数据库，直接创建 reviews 表
    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY,
        canteen_id INTEGER,
        item_id INTEGER,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        time TEXT NOT NULL,
        user_id INTEGER DEFAULT 1
      )
    `);
  }

  // 兼容旧表：新增字段（如果已存在则忽略）
  try { db.run("ALTER TABLE reviews ADD COLUMN user_id INTEGER DEFAULT 1"); } catch {}
  try { db.run("ALTER TABLE reviews ADD COLUMN item_id INTEGER DEFAULT NULL"); } catch {}

  // 关闭外键约束
  db.run('PRAGMA foreign_keys = ON');
  db.run(`
    CREATE TABLE IF NOT EXISTS canteens (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]'
    )
  `);

  // 二手商品表
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      category TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      contact TEXT DEFAULT '',
      seller TEXT NOT NULL DEFAULT '',
      user_id INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT '在售' CHECK(status IN ('在售', '已售出')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 兼容旧表：新增字段（如果已存在则忽略）
  const itemColumns = ['description', 'contact', 'status', 'created_at', 'user_id'];
  for (const col of itemColumns) {
    try { db.run(`ALTER TABLE items ADD COLUMN ${col} TEXT DEFAULT ''`); } catch {}
  }
  try { db.run("ALTER TABLE items ADD COLUMN status TEXT DEFAULT '在售'"); } catch {}
  try { db.run("ALTER TABLE items ADD COLUMN user_id INTEGER DEFAULT 1"); } catch {}
  try { db.run("ALTER TABLE items ADD COLUMN created_at TEXT DEFAULT (datetime('now','localtime'))"); } catch {}
  try { db.run("ALTER TABLE items ADD COLUMN images TEXT DEFAULT '[]'"); } catch {}
  try { db.run("ALTER TABLE items ADD COLUMN description TEXT DEFAULT ''"); } catch {}
  try { db.run("ALTER TABLE items ADD COLUMN contact TEXT DEFAULT ''"); } catch {}

  // 失物招领表
  db.run(`
    CREATE TABLE IF NOT EXISTS lost_found (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('丢失', '捡到')),
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      time TEXT NOT NULL,
      description TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待认领' CHECK(status IN ('待认领', '已认领', '已归还')),
      user_id INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
  // 兼容旧表：新增字段（如果已存在则忽略）
  const lfColumns = ['user_id', 'created_at'];
  for (const col of lfColumns) {
    try { db.run(`ALTER TABLE lost_found ADD COLUMN ${col} TEXT DEFAULT ''`); } catch {}
  }
  try { db.run("ALTER TABLE lost_found ADD COLUMN user_id INTEGER DEFAULT 1"); } catch {}
  try { db.run("ALTER TABLE lost_found ADD COLUMN created_at TEXT DEFAULT (datetime('now','localtime'))"); } catch {}

  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // ========== 检查 canteens 表是否为空，为空则插入初始数据 ==========
  const countResult = db.exec('SELECT COUNT(*) as cnt FROM canteens');
  const count = countResult[0]?.values[0][0] ?? 0;

  if (count === 0) {
    const insertCanteen = db.prepare(
      'INSERT INTO canteens (id, name, location, rating, tags) VALUES (?, ?, ?, ?, ?)'
    );
    const canteens = [
      { id: 1, name: '第一食堂', location: '东校区', rating: 4.2, tags: '["自选","快餐"]' },
      { id: 2, name: '第二食堂', location: '西校区', rating: 4.0, tags: '["面食","小炒"]' },
      { id: 3, name: '第三食堂', location: '北校区', rating: 3.8, tags: '["麻辣烫","盖饭"]' },
      { id: 4, name: '教工食堂', location: '中心区', rating: 4.5, tags: '["自助","点菜"]' },
    ];
    for (const c of canteens) {
      insertCanteen.run([c.id, c.name, c.location, c.rating, c.tags]);
    }
  }

  // ========== 检查 items 表是否为空，为空则插入初始数据 ==========
  const itemCountResult = db.exec('SELECT COUNT(*) as cnt FROM items');
  const itemCount = itemCountResult[0]?.values[0][0] ?? 0;

  if (itemCount === 0) {
    const insertItem = db.prepare(
      'INSERT INTO items (id, title, description, price, category, images, contact, seller, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const items = [
      { id: 1, title: '高等数学（第七版）', description: '九成新，内有少量笔记，适合大一学生使用', price: 25, category: '教材', images: '[]', contact: '微信: xuezhangA', seller: '学长A', user_id: 1, status: '在售' },
      { id: 2, title: '机械键盘 Cherry MX', description: '青轴，买来用了半年，手感很好', price: 150, category: '电子', images: '[]', contact: 'QQ: 12345678', seller: '同学B', user_id: 1, status: '在售' },
      { id: 3, title: '台灯 LED 护眼', description: '三档调光，USB充电，续航持久', price: 45, category: '生活', images: '[]', contact: '手机: 138****5678', seller: '学姐C', user_id: 1, status: '在售' },
      { id: 4, title: 'Python编程从入门到实践', description: '全新未拆封，附赠电子版配套代码', price: 30, category: '教材', images: '[]', contact: '微信: pythonFan', seller: '学长D', user_id: 1, status: '在售' },
      { id: 5, title: '蓝牙耳机 AirPods', description: '二代，充电仓有轻微划痕，耳机完好', price: 200, category: '电子', images: '[]', contact: '手机: 139****9012', seller: '同学E', user_id: 1, status: '在售' },
      { id: 6, title: '床上小桌板', description: '可折叠，带杯槽和手机支架', price: 35, category: '生活', images: '[]', contact: '微信: deskFan', seller: '学姐F', user_id: 1, status: '在售' },
    ];
    for (const item of items) {
      insertItem.run([item.id, item.title, item.description, item.price, item.category, item.images, item.contact, item.seller, item.user_id, item.status]);
    }
  }

  // ========== 检查 users 表是否为空，为空则插入默认用户 ==========
  const userCountResult = db.exec('SELECT COUNT(*) as cnt FROM users');
  const userCount = userCountResult[0]?.values[0][0] ?? 0;

  if (userCount === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)'
    );
    const users = [
      { id: 1, username: '学长A', password: '123456' },
      { id: 2, username: '同学B', password: '123456' },
      { id: 3, username: '学姐C', password: '123456' },
      { id: 4, username: '学长D', password: '123456' },
      { id: 5, username: '同学E', password: '123456' },
      { id: 6, username: '学姐F', password: '123456' },
    ];
    for (const u of users) {
      insertUser.run([u.id, u.username, u.password]);
    }
  }

  // ========== 检查 lost_found 表是否为空，为空则插入初始数据 ==========
  const lfCountResult = db.exec('SELECT COUNT(*) as cnt FROM lost_found');
  const lfCount = lfCountResult[0]?.values[0][0] ?? 0;

  if (lfCount === 0) {
    const insertLf = db.prepare(
      'INSERT INTO lost_found (id, type, title, location, time, description, contact, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const items = [
      { id: 1, type: '丢失', title: '蓝色水杯', location: '图书馆二楼', time: '2026-07-28', description: '膳魔师蓝色保温杯，杯身有贴纸', contact: '微信: zhangsan', status: '待认领', user_id: 1 },
      { id: 2, type: '捡到', title: '校园卡', location: '第一食堂', time: '2026-07-27', description: '在食堂门口捡到的，姓名李华', contact: '手机: 138****1234', status: '待认领', user_id: 1 },
      { id: 3, type: '丢失', title: '黑色双肩包', location: '操场看台', time: '2026-07-26', description: 'Nike黑色双肩包，内有笔记本电脑', contact: 'QQ: 87654321', status: '待认领', user_id: 1 },
      { id: 4, type: '捡到', title: '白色耳机', location: '教学楼A308', time: '2026-07-25', description: 'AirPods三代，左耳套有磨损', contact: '微信: finderW', status: '已认领', user_id: 1 },
      { id: 5, type: '丢失', title: '学生证', location: '校园内', time: '2026-07-24', description: '王小明，学号2024001', contact: '手机: 139****5678', status: '待认领', user_id: 1 },
      { id: 6, type: '捡到', title: '灰色围巾', location: '图书馆门口', time: '2026-07-23', description: '纯羊毛灰色围巾', contact: '微信: kindHeart', status: '待认领', user_id: 1 },
      { id: 7, type: '丢失', title: '计算器', location: '考试中心', time: '2026-07-22', description: '卡西欧fx-991CNX，黑色', contact: 'QQ: 11223344', status: '已归还', user_id: 1 },
      { id: 8, type: '捡到', title: '钥匙串', location: '西校区篮球场', time: '2026-07-21', description: '带有3把钥匙和一个U盘挂件', contact: '手机: 137****9012', status: '待认领', user_id: 1 },
    ];
    for (const item of items) {
      insertLf.run([item.id, item.type, item.title, item.location, item.time, item.description, item.contact, item.status, item.user_id]);
    }
  }

  // 保存到文件
  saveDatabase();
}