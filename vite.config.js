import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/photo-contest/',  // vì repo tên "photo-contest"
});
