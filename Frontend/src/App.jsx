import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Authentication from './pages/Authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeet from './pages/VideoMeet.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 1. Public Entry Gateway (Sign In / Sign Up) */}
          <Route path='/' element={<Authentication />} />

          <Route path="/privacy" element={<PrivacyPolicy />} />

          <Route path="/terms" element={<TermsOfService />} />
          
          {/* 2. 🔒 Protected Dashboard Workspace */}
          <Route path='/home' element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } />
          
          {/* 3. 🔒 Protected Dynamic Video Rooms */}
          <Route path='/room/:url' element={
            <ProtectedRoute>
              <VideoMeet />
            </ProtectedRoute>
          } />
          
          {/* 4. Wildcard Catch-All */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}