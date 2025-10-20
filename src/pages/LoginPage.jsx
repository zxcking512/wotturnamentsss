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
      const response = await fetch('http://localhost:3001/api/auth/login', {
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
        localStorage.setItem('token', 'authenticated');
        localStorage.setItem('teamName', data.user.team_name || data.user.login);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('balance', '0');
        localStorage.setItem('completedTasks', '0');
        
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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          
          {/* Заголовок МИР ТАНКОВ */}
          <div className="login-header">
            <div className="game-title">МИР ТАНКОВ</div>
          </div>

          {/* Подзаголовок */}
          <div className="login-subtitle">
            Используйте логин и пароль, который выдал вам модератор ресурса
          </div>

          {/* Форма авторизации */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ваш логин"
                className="login-input"
                required
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Пароль"
                className="login-input"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="login-actions">
              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'ВХОД...' : 'Войти'}
              </button>
            </div>
          </form>

         
        </div>
      </div>
    </div>
  );
};

export default LoginPage;