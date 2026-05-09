import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      },
      '/api/ai/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        selfHandleResponse: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Proxy SSE Error]', err.message)
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
            }
            res.write(`data: ${JSON.stringify({ error: '无法连接到后端服务器，请确保后端已启动' })}\n\n`)
            res.write('data: [DONE]\n\n')
            res.end()
          })
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.removeHeader('Accept-Encoding')
          })
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
          })
        }
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  }
})
