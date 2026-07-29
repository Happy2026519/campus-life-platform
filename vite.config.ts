import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载对应环境的 .env 文件
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // 生产环境基础路径，部署到子路径时修改此项
    base: env.VITE_BASE_URL || '/',

    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },

    // 构建配置
    build: {
      // 输出目录
      outDir: 'dist',
      // 生成 sourcemap 便于调试（生产环境建议关闭）
      sourcemap: mode === 'development',
      // 清空输出目录
      emptyOutDir: true,
    },
  }
})