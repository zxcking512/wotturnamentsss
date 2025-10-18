import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from "./components/Header/Header";
import VideoBackground from "./components/VideoBackground/VideoBackground";
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MyTeamPage from './pages/MyTeamPage';
import ModeratorPage from './pages/ModeratorPage';
import './App.css';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <VideoBackground />
        <div className="loading-spinner"></div>
        <div>Загрузка...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Компонент для маршрутов модератора
const ModeratorRoute = ({ children }) => {
  const { isAuthenticated, isModerator, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <VideoBackground />
        <div className="loading-spinner"></div>
        <div>Загрузка...</div>
      </div>
    );
  }
  
  return isAuthenticated && isModerator ? children : <Navigate to="/main" />;
};

// Основной компонент приложения
function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {/* VideoBackground теперь ВНЕ условий - всегда отображается */}
      <VideoBackground />
      {isAuthenticated && <Header />}
      <main className={isAuthenticated ? "main-content" : ""}>
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
          <Route path="*" element={<Navigate to="/main" />} />
        </Routes>
      </main>
    </div>
  );
}

// Обертка с провайдерами
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