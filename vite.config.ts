import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages で配信する場合はリポジトリ名を base に設定
export default defineConfig({
  base: '/presentation-timer/',  // ★リポジトリ名に合わせる
  plugins: [react()],
});