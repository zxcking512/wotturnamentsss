import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const teamName = localStorage.getItem('teamName') || 'RECRENT';
  const balance = localStorage.getItem('balance') || '200 000';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-content">
        
        <div className="logo">
          <div className="game-logo">МИР ТАНКОВ</div>
        </div>

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
        </nav>

        <div className="team-info">
          <div className="team-name">Команда {teamName}</div>
          <button className="logout-button" onClick={handleLogout}>
            Выйти из профиля
          </button>
        </div>

      </div>

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
          КОТЁЛ КОМАНДЫ: {balance} РУБ.
        </div>
      </div>
    </header>
  );
};

export default Header;