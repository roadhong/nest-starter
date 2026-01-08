import { Body, Controller, Get, Put, Query, Session } from '@nestjs/common';
import { SessionData } from '@root/core/auth/auth.schema';
import { RoleGuard } from '@root/core/decorator/core.decorator';
import { ROLE } from '@root/core/define/core.define';
import CoreError from '@root/core/error/core.error';
import { AccountService } from '@root/server/api/service/account/account.service';
import { ReqAdminUpdateRole, ReqGetDBData, ReqGetUsers } from '../dto/api.request.dto';
import { ResDBData, ResDBList, ResGetUsers, ResUser } from '../dto/api.response.dto';
import { MongoService } from '@root/core/mongo/mongo.service';

/**
 * 계정 컨트롤러
 */
@Controller('admin')
@RoleGuard(ROLE.ADMIN)
export class AdminController {
  constructor(
    private readonly accountService: AccountService,
    private readonly mongoService: MongoService,
  ) {}

  /**
   * 유저 목록 조회
   */
  @Get('/users')
  async getUsers(@Session() session: SessionData, @Query() req: ReqGetUsers): Promise<ResGetUsers> {
    let parsedFilter: Record<string, any> = {};
    if (req.filter) {
      try {
        parsedFilter = JSON.parse(req.filter);
      } catch (error) {
        throw CoreError.BAD_REQUEST;
      }
    }

    const dbUsers = await this.accountService.getAllUsersAsync(req.limit, req.page, parsedFilter);

    const users: ResUser[] = dbUsers.map((user) => ({
      useridx: user.useridx,
      nickname: user.nickname,
      role: user.role,
      created_at: user.created_at.toISOString(),
    }));

    const res: ResGetUsers = { users };

    return res;
  }

  /**
   * 유저 역할 업데이트
   */
  @Put('/update/role')
  async updateUserRole(@Session() session: SessionData, @Body() req: ReqAdminUpdateRole): Promise<ResUser> {
    if (req.role == ROLE.ADMIN) {
      throw CoreError.BAD_REQUEST;
    }

    const dbUsers = await this.accountService.getAccountNyUseridxAsync(req.useridx);
    dbUsers.role = req.role;
    await this.accountService.upsertAccountAsync(dbUsers);

    const res: ResUser = {
      useridx: dbUsers.useridx,
      nickname: dbUsers.nickname,
      role: dbUsers.role,
      created_at: dbUsers.created_at.toISOString(),
    };

    return res;
  }

  /**
   * DB 컬렉션 목록 조회
   */
  @Get('/db/list')
  async getDBList(@Session() session: SessionData): Promise<ResDBList> {
    const list = await this.mongoService.getCollections();

    const res: ResDBList = { result: list };

    return res;
  }

  /**
   * 컬렉션 데이터 페이지네이션 및 필터 조회
   */
  @Get('/db/page')
  async getDBDataWithFilter(@Session() session: SessionData, @Query() req: ReqGetDBData): Promise<ResDBData> {
    let parsedFilter: Record<string, any> = {};
    let parsedSort: Record<string, any> = {};
    if (req.filter) {
      try {
        parsedFilter = JSON.parse(req.filter);
      } catch (error) {
        throw CoreError.BAD_REQUEST;
      }
    }

    if (req.sort) {
      try {
        parsedSort = JSON.parse(req.sort);
      } catch (error) {
        throw CoreError.BAD_REQUEST;
      }
    }

    const data = await this.mongoService.getCollectionPage(req.name, req.page, parsedFilter, parsedSort);
    const res: ResDBData = {
      data: data.data,
      total: data.total,
    };

    return res;
  }
}
