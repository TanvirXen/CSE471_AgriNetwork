import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_API_URL || env.VITE_SOCKET_URL
  const hostRequested = process.argv.includes('--host')
  const useHttps = env.VITE_DEV_HTTPS === 'true' || hostRequested || mode === 'secure'

  if (!backendTarget) {
    throw new Error('VITE_API_URL (or VITE_SOCKET_URL) must be set in environment')
  }

  return {
    plugins: [react(), tailwindcss(), basicSsl()],
    server: {
      host: hostRequested || useHttps ? true : undefined,
      https: useHttps,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

