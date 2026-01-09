import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '@root/core/core.module';
import ServerLogger from '@root/core/server-logger/server.logger';
import path from 'path';
import { ApiServiceModule } from './service/api.service.module';

@Module({
  imports: [ApiServiceModule, CoreModule.registerDynamic(ApiModule, path.join(__dirname, 'controller'), '.controller', 'controllers')],
  providers: [],
  exports: [],
  controllers: [],
})
export class ApiModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    ServerLogger.log(`ApiModule.OnModuleInit`);
  }
}
