import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { NoAuthGuard } from '@root/core/decorator/core.decorator';
import { SlackGuard } from '@root/core/slack/slack.guard';
import { SlackService } from '@root/core/slack/slack.service';
import { SLACK_ACTION_KEY } from '@root/server/api/define/api.define';
import { AccountService } from '@root/server/api/service/account/account.service';

@Controller('slack')
@NoAuthGuard()
@UseGuards(SlackGuard)
export class SlackController {
  constructor(
    private readonly slackService: SlackService,
    private readonly accountService: AccountService,
  ) {}

  @Post('interactive')
  @ApiExcludeEndpoint()
  async postHandleInteractiveMessage(@Body() req: any): Promise<void> {
    const payload = JSON.parse(req.payload);
    const action = payload.actions[0];
    const actionId = action.action_id;
    const value = JSON.parse(action.value ?? '{}');

    let updateMessage = '---완료되었습니다.---';
    switch (actionId) {
      case SLACK_ACTION_KEY.ROLE_ACTION: {
        const dbUsers = await this.accountService.getAccountNyUseridxAsync(value.useridx);
        dbUsers.role = value.role;
        await this.accountService.upsertAccountAsync(dbUsers);
        break;
      }
      case SLACK_ACTION_KEY.REJECT_ACTION: {
        updateMessage = '---거절되었습니다.---';
        break;
      }
      default:
        updateMessage = '---알 수 없는 액션입니다.---';
    }

    const blocks = [
      ...payload.message.blocks.filter((block: any) => block.type !== 'actions'),
      ...[
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: updateMessage,
          },
        },
      ],
    ];

    await this.slackService.updateMessage({
      ts: payload.message.ts,
      channel: payload.channel.id,
      blocks,
    });
  }
}
