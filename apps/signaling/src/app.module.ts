import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { SignalingGateway } from './signaling/signaling.gateway';
import { SignalingService } from './signaling/signaling.service';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [
    // MongoDB configuration
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/screenshare'
    ),

    // JWT configuration
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),

    PassportModule,
    AuthModule,
    SessionModule,
    DeviceModule,
  ],
  providers: [
    SignalingGateway,
    SignalingService,
  ],
})
export class AppModule {}