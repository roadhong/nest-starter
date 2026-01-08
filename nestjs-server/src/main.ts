import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '@root/app.module';
import ServerConfig from '@root/core/config/server.config';
import { SERVER_TYPE, ZONE_TYPE } from '@root/core/define/core.define';
import { GlobalExceptionsFilter } from '@root/core/error/global.exception.filter';
import { GlobalValidationPipe } from '@root/core/pipe/GlobalValidationPipe';
import { RedisIoAdapter } from '@root/core/redis/redis.adapter';
import ServerLogger from '@root/core/server-logger/server.logger';
import { ResponseInterceptor } from '@root/server/api/common/interceptor/response.interceptor';
import { HttpMiddleware } from '@root/server/api/common/middleware/http.middleware';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { json } from 'express';
import helmet from 'helmet';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('UTC');

async function bootstrap(): Promise<void> {
  try {
    const server_type = ServerConfig.server_type;
    const port = ServerConfig.server_info[server_type].port;
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new ServerLogger(),
      rawBody: true,
    });

    setHelmet(app);
    if (!server_type) {
      throw new Error('Invalid server type');
    }
    if (server_type == SERVER_TYPE.API) {
      await setAPIServer(app);
    } else if (server_type == SERVER_TYPE.BATCH) {
      await setAPIServer(app);
    } else if (server_type == SERVER_TYPE.SOCKET) {
      await setWsServer(app);
    } else if (server_type == SERVER_TYPE.MQ) {
      await setMQerver(app);
    }

    await app.listen(port);

    if (ServerConfig.zone == ZONE_TYPE.LOCAL) {
      const figlet = (await import('figlet')).default;
      await figlet(ServerConfig.service.name.toUpperCase(), (err, data) => {
        if (err) {
          console.error('Figlet error:', err);

          return;
        }

        const appUrl = `http://localhost:${port}/`;
        console.log('\n'.repeat(20));

        console.log('\x1b[36m%s\x1b[0m', data);
        console.log(`${server_type.toUpperCase()} Server is running on:\x1b[0m \x1b[32m${appUrl}\x1b[0m\n`);
      });
    }

    if (server_type === SERVER_TYPE.API && ServerConfig.dev) {
      const { SwaggerDocumentService } = await import('nestjs-swagger-document');
      const { SwaggerAppModule } = await import('@root/swagger.app.module');
      const { spawn } = await import('child_process');
      const swaggerApp = await NestFactory.create(SwaggerAppModule, {});
      const swaggerService = app.get(SwaggerDocumentService);
      swaggerService.initialize(swaggerApp, () => {
        setImmediate(() => {
          const rootPath = ServerConfig.paths.root;
          ServerLogger.log('[OpenAPI] Starting openapi:generate in worker...');

          const pnpmProcess = spawn('pnpm', ['run', 'openapi:generate'], {
            cwd: rootPath,
            shell: true,
            stdio: 'inherit',
          });

          pnpmProcess.on('error', (error) => {
            ServerLogger.error(`[OpenAPI] Failed to start openapi:generate: ${error.message}`, error.stack);
          });

          pnpmProcess.on('exit', (code) => {
            if (code === 0) {
              ServerLogger.log('[OpenAPI] openapi:generate completed successfully');
            } else {
              ServerLogger.warn(`[OpenAPI] openapi:generate exited with code ${code}`);
            }
          });
        });
      });
    }
  } catch (error) {
    ServerLogger.error(`Bootstrap error: ${error?.message}`, error?.stack);
  }
}

function setHelmet(app: NestExpressApplication): void {
  app.enableCors({
    origin: (origin, callback) => {
      const allowedPatterns = [/^http:\/\/localhost:\d+$/, /^https:\/\/localhost:\d+$/];
      if (!origin) {
        callback(null, true);

        return;
      }
      if (allowedPatterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });
  app.use(helmet());
}

async function setAPIServer(app: NestExpressApplication): Promise<void> {
  const reflector = app.get(Reflector);
  app.use(new HttpMiddleware().use);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalFilters(new GlobalExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.useGlobalPipes(new GlobalValidationPipe());
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));
  app.use(compression());
}

async function setWsServer(app: NestExpressApplication): Promise<void> {
  app.useWebSocketAdapter(new RedisIoAdapter(app));
}

async function setMQerver(app: NestExpressApplication): Promise<void> {}

bootstrap().catch((err) => {
  process.exit(1);
});
