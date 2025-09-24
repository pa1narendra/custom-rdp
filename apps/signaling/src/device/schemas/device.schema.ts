import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema()
export class DeviceInfo {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  arch: string;

  @Prop({ required: true })
  hostname: string;

  @Prop({ required: true })
  version: string;
}

@Schema()
export class Device {
  @Prop({ required: true, unique: true })
  agentId: string;

  @Prop({ required: true })
  hostId: string;

  @Prop({ type: DeviceInfo, required: true })
  deviceInfo: DeviceInfo;

  @Prop({
    required: true,
    enum: ['online', 'offline', 'busy'],
    default: 'offline'
  })
  status: string;

  @Prop({ type: [String], default: [] })
  capabilities: string[];

  @Prop({ default: Date.now })
  registeredAt: Date;

  @Prop({ default: Date.now })
  lastSeen: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);