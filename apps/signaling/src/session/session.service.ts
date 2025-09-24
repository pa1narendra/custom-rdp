import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

export interface CreateSessionDto {
  hostId: string;
  hostName: string;
}

export interface JoinSessionDto {
  sessionId: string;
  participantId: string;
  participantName: string;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = new this.sessionModel({
      hostId: createSessionDto.hostId,
      hostName: createSessionDto.hostName,
      status: 'waiting',
      participants: [],
      createdAt: new Date(),
    });

    return session.save();
  }

  async joinSession(joinSessionDto: JoinSessionDto): Promise<Session> {
    const session = await this.sessionModel.findById(joinSessionDto.sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'ended') {
      throw new Error('Session has ended');
    }

    // Add participant if not already in the session
    const participantExists = session.participants.some(
      (p) => p.participantId === joinSessionDto.participantId
    );

    if (!participantExists) {
      session.participants.push({
        participantId: joinSessionDto.participantId,
        participantName: joinSessionDto.participantName,
        joinedAt: new Date(),
      });
    }

    if (session.status === 'waiting') {
      session.status = 'active';
    }

    return session.save();
  }

  async findSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionModel.findById(sessionId).exec();
  }

  async findActiveSessions(): Promise<Session[]> {
    return this.sessionModel
      .find({ status: { $in: ['waiting', 'active'] } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async endSession(sessionId: string): Promise<Session | null> {
    return this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        { status: 'ended', endedAt: new Date() },
        { new: true }
      )
      .exec();
  }

  async removeParticipant(sessionId: string, participantId: string): Promise<Session | null> {
    const session = await this.sessionModel.findById(sessionId);

    if (!session) {
      return null;
    }

    session.participants = session.participants.filter(
      (p) => p.participantId !== participantId
    );

    // If no participants left and host disconnected, end session
    if (session.participants.length === 0) {
      session.status = 'ended';
      session.endedAt = new Date();
    }

    return session.save();
  }

  async updateSessionStatus(sessionId: string, status: 'waiting' | 'active' | 'ended'): Promise<Session | null> {
    return this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        { status, ...(status === 'ended' && { endedAt: new Date() }) },
        { new: true }
      )
      .exec();
  }
}