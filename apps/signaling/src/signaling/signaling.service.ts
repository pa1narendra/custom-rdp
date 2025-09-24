import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

interface Connection {
  socket: Socket;
  userId?: string;
  deviceId?: string;
  sessionId?: string;
  role?: 'host' | 'client';
}

@Injectable()
export class SignalingService {
  private connections = new Map<string, Connection>();
  private sessions = new Map<string, Set<string>>(); // sessionId -> Set of client IDs

  addConnection(socket: Socket) {
    this.connections.set(socket.id, { socket });
    console.log(`✅ Added connection: ${socket.id}`);
  }

  removeConnection(socket: Socket) {
    const connection = this.connections.get(socket.id);
    if (connection?.sessionId) {
      this.leaveSession(socket);
    }
    this.connections.delete(socket.id);
    console.log(`🗑️ Removed connection: ${socket.id}`);
  }

  async joinSession(
    socket: Socket,
    data: { sessionId: string; userId: string; deviceId?: string; role: 'host' | 'client' }
  ) {
    const { sessionId, userId, deviceId, role } = data;

    // Update connection info
    const connection = this.connections.get(socket.id);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    connection.userId = userId;
    connection.deviceId = deviceId;
    connection.sessionId = sessionId;
    connection.role = role;

    // Add to session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }

    const sessionConnections = this.sessions.get(sessionId)!;
    sessionConnections.add(socket.id);

    // Join socket room
    await socket.join(sessionId);

    console.log(`🚪 ${role} ${userId} joined session ${sessionId}`);

    // Get other participants in the session
    const participants = Array.from(sessionConnections)
      .filter(id => id !== socket.id)
      .map(id => {
        const conn = this.connections.get(id);
        return {
          id,
          userId: conn?.userId,
          deviceId: conn?.deviceId,
          role: conn?.role,
        };
      });

    return {
      success: true,
      participants,
    };
  }

  async leaveSession(socket: Socket) {
    const connection = this.connections.get(socket.id);
    if (!connection || !connection.sessionId) {
      return { sessionId: null };
    }

    const sessionId = connection.sessionId;
    const sessionConnections = this.sessions.get(sessionId);

    if (sessionConnections) {
      sessionConnections.delete(socket.id);

      // Clean up empty sessions
      if (sessionConnections.size === 0) {
        this.sessions.delete(sessionId);
        console.log(`🗑️ Cleaned up empty session: ${sessionId}`);
      }
    }

    // Leave socket room
    await socket.leave(sessionId);

    connection.sessionId = undefined;
    console.log(`🚪 Connection ${socket.id} left session ${sessionId}`);

    return { sessionId };
  }

  getSessionParticipants(sessionId: string) {
    const sessionConnections = this.sessions.get(sessionId);
    if (!sessionConnections) return [];

    return Array.from(sessionConnections).map(id => {
      const conn = this.connections.get(id);
      return {
        id,
        userId: conn?.userId,
        deviceId: conn?.deviceId,
        role: conn?.role,
      };
    });
  }

  getSessionStats() {
    return {
      totalConnections: this.connections.size,
      activeSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([sessionId, connections]) => ({
        sessionId,
        participantCount: connections.size,
      })),
    };
  }
}