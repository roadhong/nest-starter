import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import ServerLogger from '@root/core/server-logger/server.logger';
import { AuthGuard } from '@root/core/guard/auth.guard';
import { CommonResponse } from '@root/core/common/response';
import ServerConfig from '@root/core/config/server.config';
import { SERVER_TYPE } from '@root/core/define/core.define';

@Module({})
export class ServerModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    ServerLogger.log(`ServerModule.OnModuleInit`);
  }

  static async forRootAsync(): Promise<DynamicModule> {
    const server_type = ServerConfig.server_type;
    const importModules = [];
    const providerModules = [];
    const controllerModules = [];

    if (server_type === SERVER_TYPE.API) {
      const { ApiModule } = await import('@root/server/api/api.module');
      importModules.push(ApiModule);
      providerModules.push({
        provide: APP_GUARD,
        useClass: AuthGuard,
      });
      if (ServerConfig.dev) {
        const { SwaggerDocumentModule } = await import('nestjs-swagger-document');
        const { SwaggerController } = await import('@root/server/swagger/swagger.controller');
        importModules.push(
          SwaggerDocumentModule.forRoot({
            pluginOptions: {
              dtoFileNameSuffix: ['.schema.ts', '.dto.ts', 'define.ts', 'response.ts'],
            },
            commonResponseInfo: {
              name: CommonResponse.name,
              properties: 'data',
            },
            debug: true,
          }),
        );
        controllerModules.push(SwaggerController);
      }
    } else if (server_type === SERVER_TYPE.BATCH) {
      const { BatchModule } = await import('@root/server/batch/batch.module');
      importModules.push(BatchModule);
      providerModules.push({
        provide: APP_GUARD,
        useClass: AuthGuard,
      });
    } else if (server_type === SERVER_TYPE.SOCKET) {
      const { WsModule } = await import('@root/server/ws/ws.module');
      importModules.push(WsModule);
    } else if (server_type === SERVER_TYPE.MQ) {
      const { MQConsumerModule } = await import('@root/server/mq/consumer/mq.consumer.module');
      importModules.push(MQConsumerModule);
    }

    return {
      module: ServerModule,
      imports: [...importModules],
      controllers: [...controllerModules],
      providers: [...providerModules],
      exports: [],
    };
  }
}
