import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MyTeamPage from './pages/MyTeamPage';
import ModeratorPage from './pages/ModeratorPage';
import Header from './components/Header/Header';
import VideoBackground from './components/VideoBackground/VideoBackground';
import './App.css';

// Компонент для условного отображения шапки
const Layout = ({ children }) => {
  const location = useLocation();
  const showHeader = location.pathname !== '/login';
  
  return (
    <div className="App">
      {/* ВИДЕОФОН ВСЕГДА НА ВСЕХ СТРАНИЦАХ */}
      <VideoBackground />
      {showHeader && <Header />}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Проверка авторизации...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Role-based route component
const ModeratorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }
  
  return user && user.role === 'moderator' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/" 
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;