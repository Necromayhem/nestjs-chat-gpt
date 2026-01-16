import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,          // слушать внешние подключения
    port: 5173,
    strictPort: true,
    allowedHosts: [
      '.ngrok-free.dev', // разрешаем все ngrok-free домены
    ],
  },
})