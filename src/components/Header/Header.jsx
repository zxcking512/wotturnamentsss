import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

  return (
    <header className="header">
      <div className="header-content">
        
        {/* Логотип МИР ТАНКОВ */}
        <div className="logo">
          <div className="game-logo">МИР ТАНКОВ</div>
        </div>

        {/* Навигация */}
        <nav className="navigation">
          <button 
            className={`nav-button ${isActive('/main') ? 'active' : ''}`}
            onClick={() => navigate('/main')}
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

        {/* Информация о команде */}
        <div className="team-info">
          <div className="team-name">Команда {user?.team_name || user?.username}</div>
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-text">Выйти из профиля</span>
            <svg className="logout-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.375 1.95833C0.375 1.0875 1.0875 0.375 1.95833 0.375C1.95833 0.375 4.06944 0.375 8.29167 0.375V1.95833H1.95833V13.0417H8.29167V14.625C4.06944 14.625 1.95833 14.625 1.95833 14.625C1.0875 14.625 0.375 13.9125 0.375 13.0417C0.375 5.61869 0.375 1.95833 0.375 1.95833ZM11.5975 6.70833L9.5902 4.70104L10.7098 3.58145L14.6283 7.5L10.7098 11.4186L9.5902 10.299L11.5975 8.29167H6.38375V6.70833H11.5975Z" fill="white"/>
            </svg>
          </button>
        </div>

      </div>

      {/* Котел команды */}
      {user?.role === 'captain' && (
        <div className="team-balance-container">
          <svg 
            className="balance-svg" 
            width="744" 
            height="84" 
            viewBox="0 0 744 84" 
            fill="none"
          >
            <path 
              d="M0 0H744L714 84H30L0 0Z" 
              fill="url(#paint0_linear_445_327)" 
              fillOpacity="0.5"
            />
            <defs>
              <linearGradient 
                id="paint0_linear_445_327" 
                x1="356.5" 
                y1="84" 
                x2="356.5" 
                y2="-1.07347e-06" 
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white"/>
                <stop offset="1" stopColor="#454545"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="team-balance">
            КОТЁЛ КОМАНДЫ: {formatBalance(user?.balance || 0)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;