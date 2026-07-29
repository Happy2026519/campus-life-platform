import jwt from 'jsonwebtoken';

const JWT_SECRET = 'campus-life-secret-key';

/**
 * 认证中间件
 * 从 Authorization 请求头中提取 Bearer Token，验证并解析用户信息
 * 验证通过后，将用户信息挂载到 req.user 上
 * 验证失败返回 401
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ code: 401, data: null, message: '请先登录' });
  }

  // 格式：Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ code: 401, data: null, message: 'Token格式错误' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, data: null, message: 'Token已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, data: null, message: 'Token无效' });
  }
}

export { JWT_SECRET };