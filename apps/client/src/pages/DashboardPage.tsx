import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSignaling } from '../contexts/SignalingContext';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  hostId: string;
  hostName: string;
  status: 'waiting' | 'active' | 'ended';
  participantCount: number;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, createSession, joinSession } = useSignaling();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    socket.on('sessionCreated', (session: Session) => {
      setSessions(prev => [...prev, session]);
      navigate(`/viewer/${session.id}`);
    });

    socket.on('sessionJoined', (sessionId: string) => {
      navigate(`/viewer/${sessionId}`);
    });

    socket.on('sessionsUpdated', (updatedSessions: Session[]) => {
      setSessions(updatedSessions);
    });

    // Request available sessions
    socket.emit('getSessions');

    return () => {
      socket.off('sessionCreated');
      socket.off('sessionJoined');
      socket.off('sessionsUpdated');
    };
  }, [socket, navigate]);

  const handleCreateSession = async () => {
    if (!user) return;

    setIsCreatingSession(true);
    try {
      await createSession(user.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinSessionId.trim() || !user) return;

    try {
      await joinSession(joinSessionId, user.id);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome, {user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Session Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Host a Session</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start sharing your screen with others
                </p>
                <button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSession ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </div>

            {/* Join Session Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Join a Session</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    placeholder="Enter Session ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={!joinSessionId.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          {sessions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Sessions</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <li key={session.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Session ID: {session.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              Host: {session.hostName} • {session.participantCount} participants
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'waiting'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;