import { useState, useEffect, useCallback, useRef } from 'react';
import { useSignaling } from '../contexts/SignalingContext';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const webrtcConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TODO: Add TURN servers for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'user',
    //   credential: 'pass'
    // }
  ],
};

export const useWebRTC = (sessionId: string, isHost: boolean) => {
  const { socket, sendOffer, sendAnswer, sendIceCandidate } = useSignaling();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteParticipantId = useRef<string | null>(null);

  const createPeerConnection = useCallback((participantId: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    console.log(`🔗 Creating peer connection with ${participantId}`);
    const pc = new RTCPeerConnection(webrtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate && participantId) {
        console.log(`🧊 Sending ICE candidate to ${participantId}`);
        sendIceCandidate(participantId, event.candidate, sessionId);
      }
    };

    pc.ontrack = (event) => {
      console.log(`📺 Received remote stream from ${participantId}`);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔄 Connection state: ${pc.connectionState}`);
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state: ${pc.iceConnectionState}`);
    };

    peerConnectionRef.current = pc;
    remoteParticipantId.current = participantId;

    return pc;
  }, [sessionId, sendIceCandidate]);

  const createOffer = useCallback(async (participantId: string) => {
    const pc = createPeerConnection(participantId);

    try {
      console.log(`📤 Creating offer for ${participantId}`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendOffer(participantId, offer, sessionId);
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [createPeerConnection, sendOffer, sessionId]);

  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    console.log(`📥 Received offer from ${from}`);
    const pc = createPeerConnection(from);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendAnswer(from, answer, sessionId);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }, [createPeerConnection, sendAnswer, sessionId]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit) => {
    console.log(`📥 Received answer from ${from}`);
    const pc = peerConnectionRef.current;

    if (pc && pc.signalingState === 'have-local-offer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;

    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    }
  }, []);

  const connectToParticipant = useCallback((participantId: string) => {
    console.log(`🔗 Connecting to participant ${participantId}`);

    if (isHost) {
      // Host initiates the connection
      createOffer(participantId);
    } else {
      // Client prepares to receive offer
      createPeerConnection(participantId);
    }
  }, [isHost, createOffer, createPeerConnection]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (data: { participantId: string; userId: string; role: string }) => {
      console.log(`👤 Participant joined: ${data.participantId} (${data.role})`);

      // Only connect if roles are different (host connects to client, not host to host)
      if ((isHost && data.role === 'client') || (!isHost && data.role === 'host')) {
        connectToParticipant(data.participantId);
      }
    };

    const handleParticipantLeft = (data: { participantId: string }) => {
      console.log(`👤 Participant left: ${data.participantId}`);

      if (data.participantId === remoteParticipantId.current) {
        setRemoteStream(null);
        setConnectionState('new');

        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      }
    };

    const handleOfferReceived = (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      handleOffer(data.from, data.offer);
    };

    const handleAnswerReceived = (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      handleAnswer(data.from, data.answer);
    };

    const handleIceCandidateReceived = (data: { from: string; candidate: RTCIceCandidateInit }) => {
      handleIceCandidate(data.from, data.candidate);
    };

    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('offer', handleOfferReceived);
    socket.on('answer', handleAnswerReceived);
    socket.on('ice-candidate', handleIceCandidateReceived);

    return () => {
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('offer', handleOfferReceived);
      socket.off('answer', handleAnswerReceived);
      socket.off('ice-candidate', handleIceCandidateReceived);
    };
  }, [socket, isHost, connectToParticipant, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return {
    remoteStream,
    connectionState,
    connectToParticipant,
  };
};