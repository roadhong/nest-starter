import { Module } from '@nestjs/common';
import { AppController } from '@root/app.controller';
import { CoreModule } from '@root/core/core.module';
import { ServerModule } from '@root/server/server.module';

@Module({
  imports: [CoreModule, ServerModule.forRootAsync()],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
