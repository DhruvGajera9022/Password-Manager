import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResetTokenDocument = HydratedDocument<ResetToken>;

@Schema()
export class ResetToken {
  _id: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  expire_at: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);
export const ResetTokenModel = MongooseModule.forFeature([
  { name: ResetToken.name, schema: ResetTokenSchema },
]);
