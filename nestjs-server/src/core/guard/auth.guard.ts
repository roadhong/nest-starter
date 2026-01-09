import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionUser } from '@root/core/auth/auth.schema';
import ServerConfig from '@root/core/config/server.config';
import { IS_PUBLIC_KEY, IS_ROLE_KEY } from '@root/core/decorator/core.decorator';
import CoreError from '@root/core/error/core.error';
import CryptUtil from '@root/core/utils/crypt.utils';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const requiredRole = this.reflector.getAllAndOverride<number>(IS_ROLE_KEY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const token = CryptUtil.getRequestToken(request);
    const jwtInfo = CryptUtil.jwtVerify(token, ServerConfig.jwt.key) as JwtPayload | undefined;
    if (!jwtInfo && !isPublic) {
      throw CoreError.INVALID_TOKEN;
    }
    let user: SessionUser;
    if (jwtInfo) {
      user = {
        useridx: jwtInfo['useridx'],
        role: parseInt(jwtInfo['role'], 0),
        nickname: jwtInfo['nickname'],
      };
    }

    if (requiredRole && user?.role < requiredRole) {
      throw CoreError.FORBIDDEN;
    }

    request.session = {
      user,
      request,
      response,
    };

    return true;
  }
}
