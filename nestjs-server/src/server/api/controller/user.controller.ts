import { Body, Controller, Put, Session } from '@nestjs/common';
import { SessionData } from '@root/core/auth/auth.schema';
import ServerConfig from '@root/core/config/server.config';
import { ROLE } from '@root/core/define/core.define';
import CoreError from '@root/core/error/core.error';
import { SlackService } from '@root/core/slack/slack.service';
import { ReqUserUpdateRole } from '@root/server/api/dto/api.request.dto';
import { ResMessage } from '@root/server/api/dto/api.response.dto';
import { ChatPostMessageArguments } from '@slack/web-api';

/**
 * 유저 컨트롤러
 */
@Controller('user')
export class UserController {
  constructor(private readonly slackService: SlackService) {}

  /**
   * 권한 업데이트 요청
   */
  @Put('/update/role')
  async requestRoleUpdate(@Session() session: SessionData, @Body() req: ReqUserUpdateRole): Promise<ResMessage> {
    if (req.role == ROLE.ADMIN) {
      throw CoreError.BAD_REQUEST;
    }

    try {
      const messageData: ChatPostMessageArguments = {
        channel: ServerConfig.platform.slack.channel_id,
        text: '권한 업데이트 요청',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${session.user.nickname ?? 'unknown'}* 님의 권한 요청\n요청 권한: ${ROLE[req.role]}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '승인',
                },
                style: 'primary',
                action_id: 'role_action',
                value: JSON.stringify({ useridx: session.user.useridx, role: req.role }),
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '거절',
                },
                style: 'danger',
                action_id: 'reject_action',
              },
            ],
          },
        ],
      };
      await this.slackService.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending message to Slack:', error);
      throw error;
    }

    const res: ResMessage = {
      message: 'success',
    };

    return res;
  }
}
