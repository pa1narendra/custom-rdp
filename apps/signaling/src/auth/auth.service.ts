import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

export interface LoginDto {
  username: string;
  password?: string;
}

export interface RegisterDto {
  username: string;
  password?: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: UserDocument; token: string }> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ username: registerDto.username });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (registerDto.password) {
      hashedPassword = await bcrypt.hash(registerDto.password, 10);
    }

    // Create user
    const user = new this.userModel({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const savedUser = await user.save();

    // Generate JWT token
    const payload = { sub: savedUser._id, username: savedUser.username };
    const token = this.jwtService.sign(payload);

    return {
      user: savedUser,
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: UserDocument; token: string }> {
    // Find user by username
    const user = await this.userModel.findOne({ username: loginDto.username });

    if (!user) {
      // For demo purposes, create user if they don't exist
      return this.register({ username: loginDto.username });
    }

    // Verify password if provided
    if (loginDto.password && user.password) {
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const payload = { sub: user._id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      user,
      token,
    };
  }

  async validateUser(payload: any): Promise<User | null> {
    return this.userModel.findById(payload.sub).exec();
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { status, lastSeenAt: new Date() },
        { new: true }
      )
      .exec();
  }
}