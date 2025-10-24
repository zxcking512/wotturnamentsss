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

  // Функции проверки ролей
  const isModerator = () => {
    return user && user.role === 'moderator';
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const checkAuth = async () => {
    try {
      const response = await api.checkAuth();
      
      if (response.loggedIn && response.user) {
        setUser(response.user);
        
        if (response.user.role === 'moderator') {
          setTeamData({
            team: null,
            activeChallenge: null,
            cancelCount: 0,
            isModerator: true
          });
          setLoading(false);
          return;
        }
        
        try {
          const teamResponse = await api.getMyTeam();
          setTeamData(teamResponse);
        } catch (teamError) {
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
        
        if (response.user.role === 'moderator') {
          setTeamData({
            team: null,
            activeChallenge: null,
            cancelCount: 0,
            isModerator: true
          });
          return response;
        }
        
        try {
          const teamResponse = await api.getMyTeam();
          setTeamData(teamResponse);
        } catch (teamError) {
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

  // Функция для принудительного обновления данных команды
  const refreshTeamData = async () => {
    if (!user?.token || user?.role === 'moderator') return;
    
    try {
      const teamResponse = await api.getMyTeam();
      setTeamData(teamResponse);
      return teamResponse;
    } catch (error) {
      console.error('Team data refresh error:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Интервал для автоматического обновления данных команды
  useEffect(() => {
    if (!user?.token || user?.role === 'moderator') return;

    const interval = setInterval(() => {
      refreshTeamData();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.token, user?.role]);

  const value = {
    user,
    teamData,
    loading,
    login,
    logout,
    checkAuth,
    refreshTeamData,
    isModerator,    // Добавляем функции проверки ролей
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};