import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import api from '../../services/api';
import useAnimatedCounter from '../../hooks/useAnimatedCounter';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceUpdateTrigger, setBalanceUpdateTrigger] = useState(0);
  const animatedBalance = useAnimatedCounter(currentBalance, 800);

  // Загружаем баланс команды
  const loadMyTeamBalance = async () => {
    try {
      console.log('🔄 Header: Loading team balance...');
      const response = await api.getMyTeam();
      
      if (response.team) {
        const newBalance = response.team.balance || 0;
        console.log('💰 Header: New balance:', newBalance);
        setCurrentBalance(newBalance);
      }
    } catch (error) {
      console.error('❌ Header: Load team balance error:', error);
    }
  };

  // Загружаем баланс когда появляется пользователь
  useEffect(() => {
    console.log('🚀 Header: User changed:', user);
    if (user?.token) {
      loadMyTeamBalance();
    }
  }, [user]);

  // Слушаем события обновления баланса
  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log('🔄 Header: Balance update event received');
      setBalanceUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
    };
  }, []);

  // Обновляем баланс по интервалу и при событиях
  useEffect(() => {
    console.log('⏰ Header: Setting up balance interval...');
    
    const interval = setInterval(() => {
      console.log('🔄 Header: Balance interval tick');
      loadMyTeamBalance();
    }, 2000); // Обновляем каждые 2 секунды

    // Также обновляем при событиях
    if (balanceUpdateTrigger > 0) {
      loadMyTeamBalance();
    }

    return () => {
      console.log('🧹 Header: Clearing balance interval');
      clearInterval(interval);
    };
  }, [balanceUpdateTrigger]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const getTeamDisplayName = () => {
    const teamName = user?.team_name || user?.username || '';
    if (teamName.length > 15) {
      return teamName.substring(0, 15) + '...';
    }
    return teamName;
  };

  // БАЛАНС ПОКАЗЫВАЕТСЯ ТОЛЬКО НА СТРАНИЦЕ "ВЗЯТЬ ЗАДАНИЕ" (main)
  const shouldShowBalance = user && user.role === 'captain' && location.pathname === '/main';

  console.log('🎯 Header: Render - Balance:', currentBalance, 'Animated:', animatedBalance, 'Path:', location.pathname, 'User:', user);

  return (
    <header className="header">
      <div className="header-content">
        
        <div className="logo">
          <div className="game-logo"></div>
        </div>

        <nav className="navigation">
          <button 
            className="nav-button"
            onClick={() => {}}
            style={{pointerEvents: 'none', cursor: 'default'}}
          >
            Главная страница
          </button>
          <button 
            className={`nav-button ${isActive('/main') ? 'active' : ''}`}
            onClick={() => navigate('/main')}
          >
            Взять задание
          </button>
          <button 
            className={`nav-button ${isActive('/my-team') ? 'active' : ''}`}
            onClick={() => navigate('/my-team')}
          >
            Моя команда
          </button>
          {user?.role === 'moderator' && (
            <button 
              className={`nav-button ${isActive('/moderator') ? 'active' : ''}`}
              onClick={() => navigate('/moderator')}
            >
              Панель модератора
            </button>
          )}
        </nav>

        <div className="team-info">
          <div className="team-avatar"></div>
          <div className="team-text-info">
            <div className="team-name">Команда {getTeamDisplayName()}</div>
            <button className="logout-button" onClick={handleLogout}>
              <span className="logout-text">Выйти из профиля</span>
              <svg className="logout-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.375 1.95833C0.375 1.0875 1.0875 0.375 1.95833 0.375C1.95833 0.375 4.06944 0.375 8.29167 0.375V1.95833H1.95833V13.0417H8.29167V14.625C4.06944 14.625 1.95833 14.625 1.95833 14.625C1.0875 14.625 0.375 13.9125 0.375 13.0417C0.375 5.61869 0.375 1.95833 0.375 1.95833ZM11.5975 6.70833L9.5902 4.70104L10.7098 3.58145L14.6283 7.5L10.7098 11.4186L9.5902 10.299L11.5975 8.29167H6.38375V6.70833H11.5975Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

      {shouldShowBalance && (
        <div className="team-balance-container">
          <svg 
            className="balance-svg" 
            width="744" 
            height="85" 
            viewBox="0 0 744 85" 
            fill="none"
          >
            <path 
              d="M0 0H744L714 85H30L0 0Z" 
              fill="url(#paint0_linear_445_327)" 
              fillOpacity="0.5"
            />
            <defs>
              <linearGradient 
                id="paint0_linear_445_327" 
                x1="356.5" 
                y1="85" 
                x2="356.5" 
                y2="0" 
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white"/>
                <stop offset="1" stopColor="#454545"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="team-balance">
            БАЛАНС КОМАНДЫ: {formatBalance(animatedBalance)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;