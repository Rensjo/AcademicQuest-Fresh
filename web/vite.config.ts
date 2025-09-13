import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'


export default defineConfig({
plugins: [react()],
resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
build: {
sourcemap: true,
chunkSizeWarningLimit: 1200,
rollupOptions: {
output: {
manualChunks: {
react: ['react', 'react-dom', 'react-router-dom'],
charts: ['recharts'],
ui: ['framer-motion', 'lucide-react'],
},
},
},
},
})