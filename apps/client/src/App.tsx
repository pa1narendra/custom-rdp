import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SignalingProvider } from './contexts/SignalingContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ViewerPage from './pages/ViewerPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SignalingProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/viewer/:sessionId" element={<ViewerPage />} />
            </Routes>
          </div>
        </SignalingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;