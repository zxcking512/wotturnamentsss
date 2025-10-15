import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      // Очищаем localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('teamName');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('balance');
      localStorage.removeItem('completedTasks');
      
      // Вызываем logout на сервере
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Принудительный редирект на логин
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Даже если ошибка - все равно редиректим
      window.location.href = '/login';
    }
  };

  const getPageTitle = () => {
    const role = localStorage.getItem('role');
    switch (location.pathname) {
      case '/':
        return role === 'moderator' ? 'Панель модератора' : 'Выбор задания';
      case '/my-team':
        return 'Моя команда';
      case '/moderator':
        return 'Панель модератора';
      default:
        return 'WoT Турнир';
    }
  };

  const teamName = localStorage.getItem('teamName');
  const role = localStorage.getItem('role');

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">WoT ТУРНИР</div>
        <div className="page-title">{getPageTitle()}</div>
      </div>

      <div className="header-right">
        {teamName && role !== 'moderator' && (
          <div className="team-info">
            <span className="team-name">{teamName}</span>
          </div>
        )}
        
        <nav className="nav-menu">
          {role !== 'moderator' ? (
            <>
              <button 
                className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => navigate('/')}
              >
                ВЫБОР ЗАДАНИЯ
              </button>
              <button 
                className={`nav-button ${location.pathname === '/my-team' ? 'active' : ''}`}
                onClick={() => navigate('/my-team')}
              >
                МОЯ КОМАНДА
              </button>
            </>
          ) : (
            <button 
              className={`nav-button ${location.pathname === '/moderator' ? 'active' : ''}`}
              onClick={() => navigate('/moderator')}
            >
              ПАНЕЛЬ МОДЕРАТОРА
            </button>
          )}

          <button 
            className="nav-button logout-button"
            onClick={handleLogout}
          >
            ВЫЙТИ ИЗ ПРОФИЛЯ
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;