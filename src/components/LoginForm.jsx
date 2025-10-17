import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import './LoginForm.css';

const LoginForm = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authLogin(login, password);
    
    if (result.success) {
      navigate('/main');
    } else {
      setError(result.error || 'Ошибка авторизации');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h2>ВХОД В СИСТЕМУ</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'ВХОД...' : 'ВОЙТИ'}
          </button>
        </form>
        
        <div className="test-accounts">
          <h4>Тестовые аккаунты:</h4>
          <p>Модератор: moderator / moderator123</p>
          <p>Капитан: captain1 / captain123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;