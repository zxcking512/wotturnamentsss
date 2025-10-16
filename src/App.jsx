import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MyTeamPage from './pages/MyTeamPage';
import Leaderboard from './pages/Leaderboard';
import ModeratorPage from './pages/ModeratorPage';
import './App.css';

function App() {
  const isAuthenticated = localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Header />}
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? <LoginPage /> : <Navigate to="/main" replace />
            } 
          />
          
          <Route 
            path="/main" 
            element={
              isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/my-team" 
            element={
              isAuthenticated ? <MyTeamPage /> : <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/leaderboard" 
            element={
              isAuthenticated ? <Leaderboard /> : <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/moderator" 
            element={
              isAuthenticated && localStorage.getItem('role') === 'moderator' 
                ? <ModeratorPage /> 
                : <Navigate to="/main" replace />
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;