import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import ServerConfig from '@root/core/config/server.config';
import { NoAuthGuard, SkipResponseInterceptor } from '@root/core/decorator/core.decorator';
import { DevGuard } from '@root/core/guard/dev.guard';
import { SwaggerAppCommonSkip, SwaggerDocumentService } from 'nestjs-swagger-document';

@Controller('swagger')
@SwaggerAppCommonSkip()
@ApiExcludeController()
@SkipResponseInterceptor()
@UseGuards(DevGuard)
@NoAuthGuard()
export class SwaggerController {
  constructor(private readonly swaggerDocumentService: SwaggerDocumentService) {}

  @Get('/')
  getMetadata(): any {
    const config = new SwaggerConfig();
    const spec = this.swaggerDocumentService.getDocument();

    const res = { spec: spec, config: config.options.config, servers: ServerConfig.swagger.servers };

    return res;
  }
}

/**
 * Swagger 옵션
 */
export interface SwaggerOptions {
  /**
   * token: 인증토큰 받아올 api 및 body주소
   * header: 추가할 기본 헤더 (Authorization 제외)
   */
  config?: {
    token?: Record<string, string>;
    header?: Record<string, any>;
  };
}

class SwaggerConfig {
  options: SwaggerOptions;

  constructor() {
    this.options = {
      config: {
        token: {
          ['/account/guest/login']: 'data.jwt.access_token',
          ['/account/platform/login']: 'data.jwt.access_token',
          ['/auth/token']: 'data.jwt.access_token',
        },
        header: {
          Authorization: `Bearer `,
        },
      },
    };
  }
}
