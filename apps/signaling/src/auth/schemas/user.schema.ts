import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document & { _id: any; };

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  email?: string;

  @Prop()
  password?: string;

  @Prop({
    enum: ['online', 'offline'],
    default: 'offline'
  })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastSeenAt?: Date;

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);