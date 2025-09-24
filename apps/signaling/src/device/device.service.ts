import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';

export interface RegisterDeviceDto {
  agentId: string;
  hostId: string;
  deviceInfo: {
    platform: string;
    arch: string;
    hostname: string;
    version: string;
  };
}

export interface UpdateDeviceStatusDto {
  agentId: string;
  status: 'online' | 'offline' | 'busy';
  capabilities?: string[];
}

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async registerDevice(registerDeviceDto: RegisterDeviceDto): Promise<Device> {
    // Check if device already exists
    const existingDevice = await this.deviceModel.findOne({
      agentId: registerDeviceDto.agentId,
    });

    if (existingDevice) {
      // Update existing device
      existingDevice.hostId = registerDeviceDto.hostId;
      existingDevice.deviceInfo = registerDeviceDto.deviceInfo;
      existingDevice.status = 'online';
      existingDevice.lastSeen = new Date();
      return existingDevice.save();
    }

    // Create new device
    const device = new this.deviceModel({
      agentId: registerDeviceDto.agentId,
      hostId: registerDeviceDto.hostId,
      deviceInfo: registerDeviceDto.deviceInfo,
      status: 'online',
      capabilities: ['screen_capture', 'audio_capture', 'remote_control'],
      registeredAt: new Date(),
      lastSeen: new Date(),
    });

    return device.save();
  }

  async updateDeviceStatus(updateStatusDto: UpdateDeviceStatusDto): Promise<Device | null> {
    return this.deviceModel
      .findOneAndUpdate(
        { agentId: updateStatusDto.agentId },
        {
          status: updateStatusDto.status,
          capabilities: updateStatusDto.capabilities,
          lastSeen: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  async findDeviceByAgentId(agentId: string): Promise<Device | null> {
    return this.deviceModel.findOne({ agentId }).exec();
  }

  async findDevicesByHostId(hostId: string): Promise<Device[]> {
    return this.deviceModel
      .find({ hostId, status: { $ne: 'offline' } })
      .sort({ lastSeen: -1 })
      .exec();
  }

  async findOnlineDevices(): Promise<Device[]> {
    return this.deviceModel
      .find({ status: 'online' })
      .sort({ lastSeen: -1 })
      .exec();
  }

  async disconnectDevice(agentId: string): Promise<Device | null> {
    return this.deviceModel
      .findOneAndUpdate(
        { agentId },
        { status: 'offline', lastSeen: new Date() },
        { new: true }
      )
      .exec();
  }

  async cleanupStaleDevices(staleThresholdMinutes = 10): Promise<number> {
    const staleTime = new Date(Date.now() - staleThresholdMinutes * 60 * 1000);

    const result = await this.deviceModel.updateMany(
      {
        lastSeen: { $lt: staleTime },
        status: { $ne: 'offline' },
      },
      { status: 'offline' }
    );

    return result.modifiedCount;
  }

  async getDeviceCapabilities(agentId: string): Promise<string[]> {
    const device = await this.deviceModel.findOne({ agentId }).exec();
    return device?.capabilities || [];
  }

  async updateDeviceCapabilities(agentId: string, capabilities: string[]): Promise<Device | null> {
    return this.deviceModel
      .findOneAndUpdate(
        { agentId },
        { capabilities, lastSeen: new Date() },
        { new: true }
      )
      .exec();
  }
}