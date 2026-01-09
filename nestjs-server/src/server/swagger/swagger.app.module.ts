import { Module } from '@nestjs/common';
import { AppController } from '@root/app.controller';
import { CoreModule } from '@root/core/core.module';
import { ApiModule } from '@root/server/api/api.module';
import { BatchModule } from '@root/server/batch/batch.module';

@Module({
  controllers: [AppController],
  imports: [CoreModule, ApiModule, BatchModule],
})
export class SwaggerAppModule {}
