import { defineConfig, loadEnv, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  const processEnv = {};
  
  Object.keys(env).forEach(key => {
    // Only pass REACT_APP_ variables, NODE_ENV, and relevant config variables to prevent bloating
    if (key.startsWith('REACT_APP_') || key === 'NODE_ENV') {
      let value = env[key];
      if (mode === 'production' && typeof value === 'string' && value.includes('http://localhost:5000')) {
        value = value.replace('http://localhost:5000', 'https://funfinder-xi.vercel.app');
      }
      processEnv[key] = value;
    }
  });
  
  processEnv.NODE_ENV = mode;
  return {
    optimizeDeps: {
      entries: ['index.html'],
      rolldownOptions: {
        moduleTypes: {
          '.js': 'jsx',
        },
      },
    },
    plugins: [
      {
        name: 'treat-js-files-as-jsx',
        enforce: 'pre', // Run before built-in parser checks syntax
        async transform(code, id) {
          // Normalize paths for Windows/Linux compatibility
          const normalizedId = id.replace(/\\/g, '/');
          if (!normalizedId.includes('/src/') || !normalizedId.endsWith('.js')) {
            return null;
          }

          return transformWithOxc(code, id, {
            lang: 'jsx',
            jsx: {
              runtime: 'automatic',
              development: mode === 'development',
            },
          });
        },
      },
      react(),
      // Generate pre-compressed Gzip files
      compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
      // Generate pre-compressed Brotli files
      compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
        filename: '[path][base].br',
      }),
    ],
    define: {
      'process.env': processEnv,
      'typeof process': JSON.stringify('object')
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Split code chunks to prevent single large bundle size warning
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@mui/icons-material')) {
                return 'vendor-mui-icons';
              }
              if (id.includes('@mui')) {
                return 'vendor-mui';
              }
              if (id.includes('swiper') || id.includes('owl.carousel')) {
                return 'vendor-sliders';
              }
              if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@react-oauth')) {
                return 'vendor-react-core';
              }
              return 'vendor'; // generic node_modules
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      proxy: {
        '^/(en|ka|ru|hi|ar|he|tr|hy|kk|uk|zh)?/api/.*': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        },
        '^/uploads/.*': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        },
        '/api/yandex-taxi': {
          target: 'https://taxi-routeinfo.taxi.yandex.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yandex-taxi/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
              proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, YaTaxi-Api-Key');
            });
            proxy.on('proxyRes', (proxyRes, _req, _res) => {
              proxyRes.headers['access-control-allow-origin'] = '*';
              proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
              proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-API-Key, YaTaxi-Api-Key';
            });
          }
        },
        '/api/yandex-maps': {
          target: 'https://api-maps.yandex.ru',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yandex-maps/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            });
            proxy.on('proxyRes', (proxyRes, _req, _res) => {
              proxyRes.headers['access-control-allow-origin'] = '*';
            });
          }
        }
      }
    }
  };
});
