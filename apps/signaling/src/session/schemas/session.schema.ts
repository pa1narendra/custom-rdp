import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema()
export class Participant {
  @Prop({ required: true })
  participantId: string;

  @Prop({ required: true })
  participantName: string;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

@Schema()
export class Session {
  @Prop({ required: true })
  hostId: string;

  @Prop({ required: true })
  hostName: string;

  @Prop({
    required: true,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  })
  status: string;

  @Prop({ type: [Participant], default: [] })
  participants: Participant[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: false })
  isScreenSharing: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);