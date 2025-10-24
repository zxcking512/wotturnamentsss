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
      <VideoBackground />
      
      {/* HEADER С ПРАВИЛЬНЫМ Z-INDEX */}
      {showHeader && (
        <div className="header-container">
          <Header />
        </div>
      )}
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Protected Route component - для авторизованных пользователей
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

// Role-based route component - только для модераторов
const ModeratorRoute = ({ children }) => {
  const { user, loading, isModerator } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Проверка прав доступа...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Используем функцию isModerator для проверки роли
  return isModerator() ? children : <Navigate to="/" />;
};

// Public Only Route - только для неавторизованных
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Публичный маршрут - только для неавторизованных */}
            <Route 
              path="/login" 
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              } 
            />
            
            {/* Защищенные маршруты для всех авторизованных */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              } 
            />
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
            
            {/* Маршрут только для модераторов */}
            <Route 
              path="/moderator" 
              element={
                <ModeratorRoute>
                  <ModeratorPage />
                </ModeratorRoute>
              } 
            />
            
            {/* Резервный маршрут */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;