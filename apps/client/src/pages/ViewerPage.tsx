import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSignaling } from '../contexts/SignalingContext';
import { useWebRTC } from '../hooks/useWebRTC';

const ViewerPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userId] = useState(() => `client-${Math.random().toString(36).substring(2, 15)}`);

  const { socket, connected, joinSession } = useSignaling();
  const { remoteStream, connectionState } = useWebRTC(sessionId!, false); // false = client role

  // Join session when connected
  useEffect(() => {
    if (connected && sessionId) {
      joinSession(sessionId, userId, 'client');
    }
  }, [connected, sessionId, userId, joinSession]);

  // Display remote stream
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log('📺 Setting remote stream to video element');
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getConnectionStatus = () => {
    if (!connected) return '🔴 Disconnected from server';
    if (connectionState === 'connected') return '🟢 Connected to host';
    if (connectionState === 'connecting') return '🟡 Connecting to host...';
    if (connectionState === 'failed') return '🔴 Connection failed';
    return '⚪ Waiting for host...';
  };

  const getConnectionColor = () => {
    if (!connected || connectionState === 'failed') return 'text-red-500';
    if (connectionState === 'connected') return 'text-green-500';
    if (connectionState === 'connecting') return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Remote Desktop Viewer</h1>
          <p className="text-sm text-gray-300">Session: {sessionId}</p>
        </div>
        <div className={`text-sm ${getConnectionColor()}`}>
          {getConnectionStatus()}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center relative">
        {remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
            style={{ background: '#000' }}
          />
        ) : (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🖥️</div>
            <h2 className="text-2xl mb-2">Waiting for screen share...</h2>
            <p className="text-gray-400">
              {connected
                ? 'Connected to signaling server. Waiting for host to share screen.'
                : 'Connecting to signaling server...'
              }
            </p>

            {/* Debug info */}
            <div className="mt-8 text-sm text-gray-500 space-y-1">
              <div>Socket Connected: {connected ? '✅' : '❌'}</div>
              <div>WebRTC State: {connectionState}</div>
              <div>Session ID: {sessionId}</div>
              <div>User ID: {userId}</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          onClick={() => window.close()}
        >
          Disconnect
        </button>

        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          onClick={() => {
            if (videoRef.current) {
              if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
              }
            }
          }}
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
};

export default ViewerPage;