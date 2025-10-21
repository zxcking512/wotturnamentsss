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

    // Валидация
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Заполните все поля');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/api/auth/login`, {
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
        setError(data.error || 'Ошибка авторизации. Проверьте логин и пароль');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу. Попробуйте позже');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
        {/* Основной блок авторизации */}
        <div className="login-auth-block">
          
          {/* Блок с логотипом */}
          <div className="login-logo-block"></div>

          {/* Инструкция */}
          <div className="login-instruction">
            Используйте логин и пароль, который выдал вам модератор ресурса
          </div>

          {/* Форма авторизации */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Блок для логина */}
            <div className="login-input-block">
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ваш логин"
                className="login-username-input"
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* Блок для пароля */}
            <div className="login-password-block">
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Пароль"
                className="login-password-input"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {/* Сообщение об ошибке */}
            {error && <div className="login-error-message">{error}</div>}

            {/* Кнопка входа */}
            <button 
              type="submit" 
              className="login-submit-button"
              disabled={loading}
            >
              <span className="login-button-text">
                {loading ? 'ВХОД...' : 'Войти'}
              </span>
            </button>
          </form>

        </div>

        {/* Логотип МИР ТАНКОВ - ОТДЕЛЬНО ПОД БЛОКОМ */}
        <div className="login-mt-logo"></div>

      </div>
    </div>
  );
};

export default LoginPage;