import { Body, Controller, Delete, Get, Post, Query, Session } from '@nestjs/common';
import { SessionData } from '@root/core/auth/auth.schema';
import { AuthService } from '@root/core/auth/auth.service';
import ServerConfig from '@root/core/config/server.config';
import { NoAuthGuard } from '@root/core/decorator/core.decorator';
import { PLATFORM } from '@root/core/define/core.define';
import CoreError from '@root/core/error/core.error';
import ApiError from '@root/server/api/error/api.error';
import { ReqCheckNickname, ReqGuestLogin } from '../dto/api.request.dto';
import { ResDuplicatedCheck, ResGetAccount, ResLogin, ResMessage } from '../dto/api.response.dto';
import { AccountService } from '../service/account/account.service';

/**
 * 계정 컨트롤러
 */
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 로그인
   */
  @Post('/guest/login')
  @NoAuthGuard()
  async login(@Session() session: SessionData, @Body() param: ReqGuestLogin): Promise<ResLogin> {
    const account = await this.accountService.loginAsync(session, PLATFORM.SERVER, param.device_id);
    const jwt = await this.authService.createTokenInfoAsync(session.user);
    const refresh_token = await this.authService.createRefreshTokenAsync(session.user);
    session.response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: ServerConfig.zone != 'local',
      path: '/',
    });

    const res: ResLogin = {
      nickname: account.nickname,
      role: account.role,
      jwt,
    };

    return res;
  }

  /**
   * 계정 정보
   */
  @Get('/get')
  async getAccount(@Session() session: SessionData): Promise<ResGetAccount> {
    const account = await this.accountService.getAccountNyUseridxAsync(session.user.useridx);
    if (!account) {
      throw ApiError.USER_NOT_FOUND;
    }

    const res: ResGetAccount = {
      nickname: account.nickname,
    };

    return res;
  }

  /**
   * 닉네임 중복 검사
   */
  @Get('/check/nickname')
  @NoAuthGuard()
  async checkNickname(@Session() session: SessionData, @Query() req: ReqCheckNickname): Promise<ResDuplicatedCheck> {
    if (!req.nickname || !req.nickname.trim()) {
      throw CoreError.BAD_REQUEST;
    }
    const account = await this.accountService.getAccountByNicknameAsync(req.nickname);

    const res: ResDuplicatedCheck = {
      result: account ? true : false,
    };

    return res;
  }

  /**
   * 로그아웃
   */
  @Post('/logout')
  async logout(@Session() session: SessionData): Promise<ResMessage> {
    await this.accountService.deleteLoginStateAsync(session.user.useridx);
    await this.authService.deleteRefreshTokenAsync(session.user.useridx);

    const res: ResMessage = {
      message: 'success',
    };

    return res;
  }

  /**
   * 계정삭제
   */
  @Delete('/delete')
  async deleteAccount(@Session() session: SessionData): Promise<ResMessage> {
    await this.accountService.deleteLoginStateAsync(session.user.useridx);
    await this.authService.deleteRefreshTokenAsync(session.user.useridx);
    await this.accountService.deleteAccountAsync(session.user.useridx);

    const res: ResMessage = {
      message: 'success',
    };

    return res;
  }
}
