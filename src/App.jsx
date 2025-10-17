import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from "./components/Header/Header";
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MyTeamPage from './pages/MyTeamPage';
import ModeratorPage from './pages/ModeratorPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Загрузка...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const ModeratorRoute = ({ children }) => {
  const { isAuthenticated, isModerator, loading } = useAuth();
  
  if (loading) {
    return <div>Загрузка...</div>;
  }
  
  return isAuthenticated && isModerator ? children : <Navigate to="/main" />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated && <Header />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/main" 
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-team" 
          element={
            <ProtectedRoute>
              <MyTeamPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/moderator" 
          element={
            <ModeratorRoute>
              <ModeratorPage />
            </ModeratorRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/main" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;