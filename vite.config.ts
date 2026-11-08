import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // The React Compiler needs Babel, which is why we use the Babel based
      // React plugin instead of the SWC variant. Targeting React 19 lets the
      // compiler emit calls into the React runtime that ships with React 19.
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Automatically inject global variables into every module
        additionalData: `@use "@/styles/_variables.scss" as *;`
      }
    }
  }
});
