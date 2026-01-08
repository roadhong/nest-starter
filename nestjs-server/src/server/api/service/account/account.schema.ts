import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ROLE } from '@root/core/define/core.define';

@Schema({
  collection: 'account',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DBAccount {
  @Prop()
  useridx: number;

  @Prop()
  id: string;

  @Prop()
  nickname: string;

  @Prop()
  platform: string;

  @Prop({ type: 'number', enum: Object.values(ROLE).filter((v) => typeof v === 'number') })
  role: ROLE;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const DBAccountSchema = SchemaFactory.createForClass(DBAccount);

DBAccountSchema.index({ useridx: 1 }, { unique: true });
DBAccountSchema.index({ id: 1 }, { unique: true });
DBAccountSchema.index({ nickname: 1 }, { unique: true });
DBAccountSchema.index({ created_at: 1 });
