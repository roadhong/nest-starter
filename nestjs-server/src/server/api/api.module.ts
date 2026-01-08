import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '@root/core/core.module';
import ServerLogger from '@root/core/server-logger/server.logger';
import path from 'path';
import { ApiServiceModule } from './service/api.service.module';
import { CommonResponse } from '@root/core/common/response';
import { SwaggerDocumentModule } from 'nestjs-swagger-document';

@Module({
  imports: [
    ApiServiceModule,
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
    CoreModule.registerDynamic(ApiModule, path.join(__dirname, 'controller'), '.controller', 'controllers'),
  ],
  providers: [],
  exports: [],
  controllers: [],
})
export class ApiModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    ServerLogger.log(`ApiModule.OnModuleInit`);
  }
}
