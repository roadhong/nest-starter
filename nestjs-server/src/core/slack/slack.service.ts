import { Injectable } from '@nestjs/common';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient } from '@slack/web-api';

@Injectable()
export class SlackService {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async sendMessage(config: ChatPostMessageArguments): Promise<void> {
    await this.client.chat.postMessage(config);
  }

  async deleteMessage(channel: string, ts: string): Promise<void> {
    await this.client.chat.delete({ channel, ts });
  }

  async updateMessage(config: ChatUpdateArguments): Promise<void> {
    await this.client.chat.update(config);
  }
}
