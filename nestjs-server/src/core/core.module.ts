import { CacheModule } from '@nestjs/cache-manager';
import { DynamicModule, Module, Type, type OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import ServerConfig from '@root/core/config/server.config';
import { GoogleModule } from '@root/core/google/google.module';
import { SlackModule } from '@root/core/slack/slack.module';
import { readdirSync } from 'fs';
import path from 'path';
import { AuthModule } from './auth/auth.module';
import { MongoModule } from './mongo/mongo.module';
import { RedisModule } from './redis/redis.module';
import ServerLogger from './server-logger/server.logger';

@Module({
  imports: [
    MongoModule,
    RedisModule.forRootAsync(),
    CacheModule.register({ isGlobal: true }),
    AuthModule,
    ThrottlerModule.forRootAsync({ useFactory: async () => ServerConfig.throttler }),
    GoogleModule,
    SlackModule.forRootAsync({
      useFactory: async () => {
        return {
          token: ServerConfig.platform.slack?.token,
        };
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [],
})
export class CoreModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    ServerLogger.log(`CoreModule.onModuleInit`);
  }

  static registerDynamic(t: Type<any>, target_path: string, end_with_file_name: string, type: 'controllers' | 'providers' | 'imports', exclude?: string[]): DynamicModule {
    const files = readdirSync(target_path).filter((file) => {
      const matchesEnd = file.endsWith(`${end_with_file_name}.js`) || file.endsWith(`${end_with_file_name}.ts`);
      if (!matchesEnd) return false;

      if (exclude) {
        return !exclude.some((excludePattern) => file.includes(excludePattern));
      }

      return true;
    });
    const classes: any[] = files.map((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(path.join(target_path, file));
      const clazz = Object.values(mod).find((item) => typeof item === 'function');

      return clazz;
    });

    for (const c of classes) {
      ServerLogger.log(`Added ${t.name} ${type} = ${c.name}`);
    }

    const result: DynamicModule = {
      module: t,
    };
    result[type] = classes;

    return result;
  }
}
