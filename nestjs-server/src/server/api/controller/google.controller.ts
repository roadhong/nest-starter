import { Body, Controller, Get, Post, Query, Session } from '@nestjs/common';
import { SessionData } from '@root/core/auth/auth.schema';
import { AuthService } from '@root/core/auth/auth.service';
import ServerConfig from '@root/core/config/server.config';
import { NoAuthGuard, RoleGuard } from '@root/core/decorator/core.decorator';
import { PLATFORM, ROLE } from '@root/core/define/core.define';
import { GoogleAccountService } from '@root/core/google/google.account.service';
import { GoogleSheetService } from '@root/core/google/google.sheet.service';
import { AccountService } from '@root/server/api/service/account/account.service';
import { ReqGetSheet as ReqGetSheetData, ReqGoogleLogin } from '../dto/api.request.dto';
import { ResGetSheetData, ResLogin } from '../dto/api.response.dto';

/**
 * 계정 컨트롤러
 */
@Controller('google')
export class GoogleController {
  constructor(
    private readonly accountService: AccountService,
    private readonly googleAccountService: GoogleAccountService,
    private readonly googleSheetService: GoogleSheetService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 구글 로그인
   */
  @Post('/login')
  @NoAuthGuard()
  async googleLogin(@Session() session: SessionData, @Body() param: ReqGoogleLogin): Promise<ResLogin> {
    const payload = await this.googleAccountService.getGoogleAsync(param.token);
    const account = await this.accountService.loginAsync(session, PLATFORM.GOOGLE, payload.sub, payload.name);
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
      profile: {
        name: payload.name,
        email: payload.email,
      },
    };

    return res;
  }

  /**
   * 스프레드시트 조회
   */
  @Get('/sheet/data')
  @RoleGuard(ROLE.USER)
  async getSheetData(@Session() session: SessionData, @Query() param: ReqGetSheetData): Promise<ResGetSheetData> {
    const result = await this.googleSheetService.getSheetDataByUrl(param.url, param.sheet_name, param.range);

    const res: ResGetSheetData = { result: result };

    return res;
  }
}
