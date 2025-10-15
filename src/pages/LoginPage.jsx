import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          login: formData.username, 
          password: formData.password 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Сохраняем данные в localStorage
        localStorage.setItem('token', 'authenticated');
        localStorage.setItem('teamName', data.user.team_name || data.user.login);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('balance', '0');
        localStorage.setItem('completedTasks', '0');
        
        // Редирект
        if (data.user.role === 'moderator') {
          window.location.href = '/moderator';
        } else {
          window.location.href = '/';
        }
        
      } else {
        setError(data.error || 'Ошибка авторизации');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (username, password) => {
    setFormData({ username, password });
    
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">МИР ТАНКОВ</h1>
        </div>

        <div className="login-card">
          <div className="login-description">
            Используйте логин и пароль, который выдал вам организатор турнира
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-section">
              <div className="input-group">
                <div className="input-label">ВАШ ЛОГИН</div>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Введите ваш логин"
                  className="login-input"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="input-group">
                <div className="input-label">ПАРОЛЬ</div>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Введите ваш пароль"
                  className="login-input"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="login-actions">
              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'ВХОД...' : 'ВОЙТИ'}
              </button>
            </div>
          </form>

          <div className="test-section">
            <div className="test-title">Тестовые доступы:</div>
            
            <div className="test-accounts">
              <div className="test-account-group">
                <div className="test-login">captain1 / captain123</div>
                <div className="test-role">(Капитан)</div>
                <button 
                  onClick={() => handleQuickLogin('captain1', 'captain123')}
                  className="quick-login-button"
                  type="button"
                  disabled={loading}
                >
                  БЫСТРЫЙ ВХОД
                </button>
              </div>

              <div className="test-account-group">
                <div className="test-login">moderator / moderator123</div>
                <div className="test-role">(Модератор)</div>
                <button 
                  onClick={() => handleQuickLogin('moderator', 'moderator123')}
                  className="quick-login-button"
                  type="button"
                  disabled={loading}
                >
                  БЫСТРЫЙ ВХОД
                </button>
              </div>
            </div>

            <div className="test-note">
              <strong>Для теста:</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;