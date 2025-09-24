import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SignalingContextType {
  socket: Socket | null;
  connected: boolean;
  joinSession: (sessionId: string, userId: string, role: 'host' | 'client') => void;
  leaveSession: () => void;
  sendOffer: (to: string, offer: RTCSessionDescriptionInit, sessionId: string) => void;
  sendAnswer: (to: string, answer: RTCSessionDescriptionInit, sessionId: string) => void;
  sendIceCandidate: (to: string, candidate: RTCIceCandidateInit, sessionId: string) => void;
}

const SignalingContext = createContext<SignalingContextType | undefined>(undefined);

interface SignalingProviderProps {
  children: ReactNode;
}

export const SignalingProvider: React.FC<SignalingProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001/signaling', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to signaling server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from signaling server');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('💥 Signaling error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinSession = (sessionId: string, userId: string, role: 'host' | 'client') => {
    if (socket) {
      console.log(`🚪 Joining session ${sessionId} as ${role}`);
      socket.emit('join-session', { sessionId, userId, role });
    }
  };

  const leaveSession = () => {
    if (socket) {
      console.log('🚪 Leaving session');
      socket.emit('leave-session');
    }
  };

  const sendOffer = (to: string, offer: RTCSessionDescriptionInit, sessionId: string) => {
    if (socket) {
      console.log(`📤 Sending offer to ${to}`);
      socket.emit('offer', { to, offer, sessionId });
    }
  };

  const sendAnswer = (to: string, answer: RTCSessionDescriptionInit, sessionId: string) => {
    if (socket) {
      console.log(`📤 Sending answer to ${to}`);
      socket.emit('answer', { to, answer, sessionId });
    }
  };

  const sendIceCandidate = (to: string, candidate: RTCIceCandidateInit, sessionId: string) => {
    if (socket) {
      socket.emit('ice-candidate', { to, candidate, sessionId });
    }
  };

  const value: SignalingContextType = {
    socket,
    connected,
    joinSession,
    leaveSession,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };

  return (
    <SignalingContext.Provider value={value}>
      {children}
    </SignalingContext.Provider>
  );
};

export const useSignaling = (): SignalingContextType => {
  const context = useContext(SignalingContext);
  if (!context) {
    throw new Error('useSignaling must be used within a SignalingProvider');
  }
  return context;
};