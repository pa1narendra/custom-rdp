import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SignalingService } from './signaling.service';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-session' | 'leave-session';
  sessionId: string;
  from?: string;
  to?: string;
  data?: any;
}

@WebSocketGateway({
  namespace: '/signaling',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002', 'tauri://localhost'],
    credentials: true,
  },
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly signalingService: SignalingService) {}

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
    this.signalingService.addConnection(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
    this.signalingService.removeConnection(client);
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string; deviceId?: string; role: 'host' | 'client' }
  ) {
    console.log(`🚪 Join session request: ${data.sessionId} from ${data.userId} as ${data.role}`);

    const result = await this.signalingService.joinSession(client, data);

    if (result.success) {
      // Notify other participants
      client.to(data.sessionId).emit('participant-joined', {
        participantId: client.id,
        userId: data.userId,
        role: data.role,
      });

      // Send current participants to new joiner
      client.emit('session-joined', {
        sessionId: data.sessionId,
        participants: result.participants,
      });
    } else {
      client.emit('error', { message: result.error });
    }
  }

  @SubscribeMessage('leave-session')
  async handleLeaveSession(@ConnectedSocket() client: Socket) {
    const result = await this.signalingService.leaveSession(client);

    if (result.sessionId) {
      client.to(result.sessionId).emit('participant-left', {
        participantId: client.id,
      });
    }
  }

  @SubscribeMessage('offer')
  async handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; offer: RTCSessionDescriptionInit; sessionId: string }
  ) {
    console.log(`📤 Relaying offer from ${client.id} to ${data.to}`);

    this.server.to(data.to).emit('offer', {
      from: client.id,
      offer: data.offer,
      sessionId: data.sessionId,
    });
  }

  @SubscribeMessage('answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; answer: RTCSessionDescriptionInit; sessionId: string }
  ) {
    console.log(`📤 Relaying answer from ${client.id} to ${data.to}`);

    this.server.to(data.to).emit('answer', {
      from: client.id,
      answer: data.answer,
      sessionId: data.sessionId,
    });
  }

  @SubscribeMessage('ice-candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; candidate: RTCIceCandidateInit; sessionId: string }
  ) {
    console.log(`🧊 Relaying ICE candidate from ${client.id} to ${data.to}`);

    this.server.to(data.to).emit('ice-candidate', {
      from: client.id,
      candidate: data.candidate,
      sessionId: data.sessionId,
    });
  }

  @SubscribeMessage('screen-share-started')
  async handleScreenShareStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    console.log(`🖥️ Screen share started by ${client.id} in session ${data.sessionId}`);

    client.to(data.sessionId).emit('screen-share-started', {
      hostId: client.id,
      sessionId: data.sessionId,
    });
  }

  @SubscribeMessage('screen-share-stopped')
  async handleScreenShareStopped(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    console.log(`🛑 Screen share stopped by ${client.id} in session ${data.sessionId}`);

    client.to(data.sessionId).emit('screen-share-stopped', {
      hostId: client.id,
      sessionId: data.sessionId,
    });
  }
}