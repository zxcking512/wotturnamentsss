import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MyTeamPage from './pages/MyTeamPage';
import ModeratorPage from './pages/ModeratorPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const teamName = localStorage.getItem('teamName');
      setIsAuthenticated(!!token && !!teamName);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Header />}
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <MainPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/my-team" 
            element={isAuthenticated ? <MyTeamPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/moderator" 
            element={
              isAuthenticated && localStorage.getItem('role') === 'moderator' 
                ? <ModeratorPage /> 
                : <Navigate to="/" />
            } 
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;