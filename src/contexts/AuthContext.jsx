import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await api.checkAuth();
      console.log('Auth check response:', response);
      
      if (response.loggedIn && response.user) {
        setUser(response.user);
        
        // ЕСЛИ ПОЛЬЗОВАТЕЛЬ МОДЕРАТОР - НЕ ГРУЗИМ ДАННЫЕ КОМАНДЫ
        if (response.user.role === 'moderator') {
          console.log('User is moderator, skipping team data load');
          setTeamData({
            team: null,
            activeChallenge: null,
            cancelCount: 0,
            isModerator: true
          });
          setLoading(false);
          return;
        }
        
        // ДЛЯ КАПИТАНОВ - ГРУЗИМ ДАННЫЕ КОМАНДЫ
        try {
          console.log('Loading team data for captain...');
          const teamResponse = await api.getMyTeam();
          console.log('Team data response:', teamResponse);
          setTeamData(teamResponse);
        } catch (teamError) {
          console.error('Team data load error (non-critical):', teamError);
          // НЕ БЛОКИРУЕМ АВТОРИЗАЦИЮ ИЗ-ЗА ОШИБКИ ДАННЫХ КОМАНДЫ
          setTeamData({
            team: null,
            activeChallenge: null,
            cancelCount: 0,
            isModerator: false
          });
        }
      } else {
        setUser(null);
        setTeamData(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setTeamData(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (login, password) => {
    try {
      setLoading(true);
      const response = await api.login(login, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        
        // ЕСЛИ ПОЛЬЗОВАТЕЛЬ МОДЕРАТОР - НЕ ГРУЗИМ ДАННЫЕ КОМАНДЫ
        if (response.user.role === 'moderator') {
          setTeamData({
            team: null,
            activeChallenge: null,
            cancelCount: 0,
            isModerator: true
          });
          setLoading(false);
          return response;
        }
        
        // ДЛЯ КАПИТАНОВ - ГРУЗИМ ДАННЫЕ КОМАНДЫ
        try {
          const teamResponse = await api.getMyTeam();
          setTeamData(teamResponse);
        } catch (teamError) {
          console.error('Team data load error after login:', teamError);
          setTeamData({
            team: null,
            activeChallenge: null,
            cancelCount: 0,
            isModerator: false
          });
        }
        
        return response;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTeamData(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    teamData,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};