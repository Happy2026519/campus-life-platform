/**
 * API 配置文件
 *
 * 环境变量说明：
 *   VITE_API_BASE - 后端 API 基础地址
 *     开发环境：空字符串（通过 Vite 代理 /api → http://localhost:3001）
 *     生产环境：空字符串（同域部署）或后端实际地址（前后端分离部署）
 *
 * 代理配置在 vite.config.ts 中，仅开发环境生效。
 */

/** 后端 API 基础地址（从环境变量读取，默认空字符串） */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/**
 * 拼接完整 API 地址
 * @param path - API 路径，如 '/api/canteens'
 * @returns 完整 URL
 */
export function getApiUrl(path: string): string {
  // 确保 path 以 '/' 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

/** 请求选项 */
export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown> | FormData;
}

/** 统一 API 响应格式 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/**
 * 带认证的请求工具函数
 * - 自动从 localStorage 获取 token
 * - 有 token 时添加 Authorization: Bearer <token> 请求头
 * - 自动处理 JSON 序列化与反序列化
 *
 * @param options - 请求选项
 * @returns { code, data, message } 格式的响应数据
 */
export async function apiRequest<T = unknown>(
  options: ApiRequestOptions
): Promise<ApiResponse<T>> {
  const { url, method = 'GET', body } = options;

  const headers: Record<string, string> = {};

  // 从 localStorage 获取 token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 构建 fetch 选项
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // 处理请求体
  if (body !== undefined) {
    if (body instanceof FormData) {
      // FormData 不设置 Content-Type，让浏览器自动设置 multipart boundary
      fetchOptions.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
      // 重新设置 headers（因为上面已赋值）
      fetchOptions.headers = headers;
    }
  }

  try {
    const response = await fetch(getApiUrl(url), fetchOptions);

    // 尝试解析 JSON 响应
    const result = await response.json();

    // 如果 HTTP 状态码不是 2xx，但 JSON 中已有 code/message，也一并返回
    if (!response.ok && !result.code) {
      return {
        code: response.status,
        data: null as unknown as T,
        message: `请求失败: ${response.statusText}`,
      };
    }

    return result as ApiResponse<T>;
  } catch (error) {
    // 网络错误或 JSON 解析错误
    const message =
      error instanceof Error ? error.message : '未知网络错误';
    return {
      code: 0,
      data: null as unknown as T,
      message: `网络请求失败: ${message}`,
    };
  }
}