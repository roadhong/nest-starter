import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import figlet from 'figlet';
import fs from 'fs';

import path from 'path';
import { defineConfig, ViteDevServer } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  const zone = process.env.zone;
  const build_type = process.env.build_type;
  if (!zone || !build_type) {
    console.error('Environment variables "zone" and "build_type" must be defined.');
    process.exit(1);
  }
  const configPath = path.join(__dirname, '..', 'nestjs-server', 'src', 'env', `${zone}-config.json`);

  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  process.env.VITE_BUILD_TYPE = build_type;
  process.env.VITE_ZONE = zone;
  process.env.VITE_SERVER_NAME = config.service?.name ?? 'Nest';
  process.env.VITE_SERVER_HTTP_PORT = config.server_info.api.port ?? '0';
  process.env.VITE_SERVER_SOCKET_PORT = config.server_info.socket.port ?? '0';

  return {
    base: `/client/${build_type}`,
    plugins: [
      react(),
      {
        name: 'vite-build-logger',
        apply: 'serve',
        configureServer(server: ViteDevServer): void {
          server.httpServer?.on('listening', () => {
            figlet(build_type, (err, data) => {
              if (err) {
                console.dir(err);

                return;
              }
              console.log(`\x1b[36m${data}\x1b[0m\n`);
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@root': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: path.resolve(__dirname, build_type),
      target: 'esnext',
      sourcemap: true,
      minify: false,
      chunkSizeWarningLimit: 1500,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id: string): string | undefined {
            if (id.includes('node_modules/dayjs')) return 'dayjs';
            if (id.includes('node_modules/@codemirror')) return 'codemirror';
          },
        },
      },
    },
    server: {
      host: true,
      port: 3000,
    },
    css: {
      postcss: {
        plugins: [autoprefixer({})],
      },
      preprocessorOptions: {
        scss: {
          quietDeps: true,
        },
      },
    },
  };
});
