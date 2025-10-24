import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ModeratorPage.css';

const ModeratorPage = () => {
  const { user, isModerator, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [probabilities, setProbabilities] = useState({
    epic: 10,
    common: 60,
    troll: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Проверка прав доступа
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isModerator()) {
      setMessage('Доступ запрещен. Только для модераторов.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }
    
    loadData();
  }, [user, authLoading, isModerator, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsResponse, probResponse] = await Promise.all([
        api.getTeams(),
        api.getProbabilities()
      ]);
      
      setTeams(teamsResponse);
      if (probResponse) {
        setProbabilities(probResponse);
      }
    } catch (error) {
      console.error('Load data error:', error);
      setMessage('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamUpdate = async (teamId, field, value) => {
    try {
      const updates = { [field]: value };
      await api.updateTeam(teamId, updates);
      
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId ? { ...team, [field]: value } : team
        )
      );
      
      setMessage('Данные команды обновлены');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update team error:', error);
      setMessage('Ошибка обновления данных команды');
    }
  };

  const handleChallengeStatusUpdate = async (teamId, newStatus) => {
    try {
      await api.updateTeam(teamId, { challenge_status: newStatus });
      
      if (newStatus === 'completed') {
        const team = teams.find(t => t.id === teamId);
        if (team && team.challenge_reward) {
          const newBalance = team.balance + team.challenge_reward;
          const newCompleted = team.completed_challenges + 1;
          
          await api.updateTeam(teamId, { 
            balance: newBalance,
            completed_challenges: newCompleted
          });
          
          setTeams(prevTeams => 
            prevTeams.map(team => 
              team.id === teamId ? { 
                ...team, 
                balance: newBalance,
                completed_challenges: newCompleted,
                challenge_status: newStatus 
              } : team
            )
          );
        }
      } else {
        setTeams(prevTeams => 
          prevTeams.map(team => 
            team.id === teamId ? { ...team, challenge_status: newStatus } : team
          )
        );
      }
      
      setMessage('Статус задания обновлен');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update challenge status error:', error);
      setMessage('Ошибка обновления статуса задания');
    }
  };

  const handleProbabilityUpdate = async (newProbabilities) => {
    try {
      setSaving(true);
      await api.updateProbabilities(newProbabilities);
      setProbabilities(newProbabilities);
      setMessage('Вероятности обновлены');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update probabilities error:', error);
      setMessage('Ошибка обновления вероятностей');
    } finally {
      setSaving(false);
    }
  };

  const handleResetChallenges = async () => {
    if (!window.confirm('Вы уверены, что хотите сбросить историю заданий для всех команд? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setSaving(true);
      await api.resetChallenges();
      setMessage('История заданий сброшена для всех команд');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Reset challenges error:', error);
      setMessage('Ошибка сброса истории заданий');
    } finally {
      setSaving(false);
    }
  };

  const handleProbabilityChange = (type, value) => {
    const newValue = parseInt(value) || 0;
    const newProbabilities = { ...probabilities, [type]: newValue };
    setProbabilities(newProbabilities);
  };

  const calculateTotal = () => {
    return Object.values(probabilities).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#f59e0b';
      case 'pending': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#cccccc';
    }
  };

  // Если проверка прав еще идет
  if (authLoading) {
    return (
      <div className="moderator-page">
        <div className="moderator-container">
          <div style={{ 
            color: 'white', 
            textAlign: 'center', 
            fontSize: '1.5rem',
            padding: '2rem' 
          }}>
            Проверка прав доступа...
          </div>
        </div>
      </div>
    );
  }

  // Если нет прав - показываем сообщение
  if (!user || !isModerator()) {
    return (
      <div className="moderator-page">
        <div className="moderator-container">
          <div className="access-denied">
            <h1>ДОСТУП ЗАПРЕЩЕН</h1>
            <p>Эта страница доступна только для модераторов</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="moderator-page">
        <div className="moderator-container">
          <div style={{ 
            color: 'white', 
            textAlign: 'center', 
            fontSize: '1.5rem',
            padding: '2rem' 
          }}>
            Загрузка данных...
          </div>
        </div>
      </div>
    );
  }

  const totalProbability = calculateTotal();

  return (
    <div className="moderator-page">
      <div className="moderator-container">
        <div className="moderator-header">
          <h1 className="page-title">ПАНЕЛЬ МОДЕРАТОРА</h1>
          <div className="user-info">
            Вы вошли как: <strong>{user.email}</strong> | Роль: <strong>Модератор</strong>
          </div>
          {message && <div className="message">{message}</div>}
        </div>

        {/* Управление вероятностями */}
        <div className="probabilities-section">
          <h2>УПРАВЛЕНИЕ ВЕРОЯТНОСТЯМИ ВЫПАДЕНИЯ</h2>
          <div className="probabilities-grid">
            <div className="probability-item">
              <label>Эпическое безумство:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probabilities.epic}
                onChange={(e) => handleProbabilityChange('epic', e.target.value)}
              />
              <span>%</span>
            </div>
            <div className="probability-item">
              <label>Простая шалость:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probabilities.common}
                onChange={(e) => handleProbabilityChange('common', e.target.value)}
              />
              <span>%</span>
            </div>
            <div className="probability-item">
              <label>Пакость:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probabilities.troll}
                onChange={(e) => handleProbabilityChange('troll', e.target.value)}
              />
              <span>%</span>
            </div>
          </div>
          
          <div className="probability-total">
            <strong>Всего: {totalProbability}%</strong>
            {totalProbability !== 100 && (
              <span className="error">Сумма должна быть равна 100%!</span>
            )}
          </div>

          <div className="probability-actions">
            <button
              onClick={() => handleProbabilityUpdate(probabilities)}
              disabled={saving || totalProbability !== 100}
              className="btn-save"
            >
              {saving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ВЕРОЯТНОСТИ'}
            </button>
            
            <button
              onClick={handleResetChallenges}
              disabled={saving}
              className="btn-reset"
            >
              СБРОС ИСТОРИИ ЗАДАНИЙ
            </button>
          </div>
        </div>

        {/* Управление командами */}
        <div className="teams-section">
          <h2>УПРАВЛЕНИЕ КОМАНДАМИ</h2>
          <div className="table-container">
            <table className="teams-table">
              <thead>
                <tr>
                  <th>Команда</th>
                  <th>Баланс</th>
                  <th>Выполнено заданий</th>
                  <th>Текущее задание</th>
                  <th>Статус задания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="team-name">{team.name}</td>
                    <td>
                      <input
                        type="number"
                        value={team.balance || 0}
                        onChange={(e) => handleTeamUpdate(team.id, 'balance', parseInt(e.target.value) || 0)}
                        className="balance-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={team.completed_challenges || 0}
                        onChange={(e) => handleTeamUpdate(team.id, 'completed_challenges', parseInt(e.target.value) || 0)}
                        className="challenges-input"
                      />
                    </td>
                    <td className="challenge-title">
                      {team.challenge_title || 'Нет задания'}
                    </td>
                    <td>
                      <select
                        value={team.challenge_status || ''}
                        onChange={(e) => handleChallengeStatusUpdate(team.id, e.target.value)}
                        style={{ color: getStatusColor(team.challenge_status) }}
                      >
                        <option value="">Нет задания</option>
                        <option value="active">Выполняется</option>
                        <option value="pending">Ждёт модерации</option>
                        <option value="completed">Выполнено</option>
                        <option value="cancelled">Не выполнено</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorPage;