import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import { teamsAPI } from "../services/api";
import './MyTeamPage.css';

const MyTeamPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [cancelCount, setCancelCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const response = await teamsAPI.getMyTeam();
      setTeamData(response.team);
      setActiveChallenge(response.activeChallenge);
      setCancelCount(response.cancelCount || 0);
    } catch (error) {
      setError('Ошибка загрузки данных команды');
      console.error('Load team data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChallenge = async () => {
    try {
      const response = await teamsAPI.completeChallenge();
      if (response.success) {
        alert('Задание отправлено на модерацию!');
        await loadTeamData();
      }
    } catch (error) {
      setError('Ошибка при завершении задания');
      console.error('Complete challenge error:', error);
    }
  };

  const handleCancelChallenge = async () => {
    if (!activeChallenge) return;

    const freeCancelsLeft = Math.max(0, 3 - cancelCount);
    const penaltyAmount = freeCancelsLeft > 0 ? 0 : Math.round(activeChallenge.reward * 0.2);

    let message = `Вы уверены, что хотите отменить задание?\n\n`;
    message += `Бесплатных отмен осталось: ${freeCancelsLeft}\n`;
    if (penaltyAmount > 0) {
      message += `Будет списан штраф: ${penaltyAmount} руб.`;
    }

    if (!window.confirm(message)) {
      return;
    }

    try {
      const response = await teamsAPI.cancelChallenge();
      if (response.success) {
        if (response.penaltyApplied) {
          alert(`Задание отменено. Списано ${response.penaltyAmount} руб. штрафа`);
        } else {
          alert('Задание отменено');
        }
        await loadTeamData();
        
        // Если отмена прошла успешно, переходим на страницу заданий
        navigate('/main');
      }
    } catch (error) {
      setError('Ошибка при отмене задания');
      console.error('Cancel challenge error:', error);
    }
  };

  const getCancelStatus = () => {
    const freeCancelsLeft = Math.max(0, 3 - cancelCount);
    
    if (freeCancelsLeft === 3) {
      return { text: '3 бесплатные отмены', color: 'green' };
    } else if (freeCancelsLeft > 0) {
      return { text: `Осталось ${freeCancelsLeft} бесплатных отмен`, color: 'orange' };
    } else {
      return { text: 'Бесплатные отмены закончились. Следующая отмена: -20% от награды', color: 'red' };
    }
  };

  if (loading) {
    return <div className="page-container">Загрузка...</div>;
  }

  const cancelStatus = getCancelStatus();

  return (
    <div className="my-team-page">
      {error && <div className="error-message">{error}</div>}
      
      <div className="team-header">
        <h1>МОЯ КОМАНДА</h1>
        <div className="team-stats">
          <div className="stat">
            <span className="stat-label">Команда:</span>
            <span className="stat-value">{teamData?.name}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Баланс:</span>
            <span className="stat-value">{new Intl.NumberFormat('ru-RU').format(teamData?.balance || 0)} руб.</span>
          </div>
          <div className="stat">
            <span className="stat-label">Выполнено заданий:</span>
            <span className="stat-value">{teamData?.completed_challenges || 0}</span>
          </div>
        </div>
      </div>

      <div className="cancel-info" style={{ color: cancelStatus.color }}>
        <strong>Статус отмен:</strong> {cancelStatus.text}
      </div>

      {activeChallenge ? (
        <div className="active-challenge">
          <h2>ТЕКУЩЕЕ ЗАДАНИЕ</h2>
          <div className="challenge-card">
            <div className="challenge-rarity">{activeChallenge.rarity}</div>
            <div className="challenge-reward">+{new Intl.NumberFormat('ru-RU').format(activeChallenge.reward)} руб.</div>
            <h3 className="challenge-title">{activeChallenge.title}</h3>
            <p className="challenge-description">{activeChallenge.description}</p>
            <div className="challenge-actions">
              <button 
                onClick={handleCompleteChallenge}
                className="btn-complete"
                disabled={activeChallenge.status === 'pending'}
              >
                {activeChallenge.status === 'pending' ? 'ОЖИДАЕТ МОДЕРАЦИИ' : 'ЗАДАНИЕ ВЫПОЛНЕНО'}
              </button>
              <button 
                onClick={handleCancelChallenge}
                className="btn-cancel"
              >
                ОТМЕНИТЬ ЗАДАНИЕ
              </button>
            </div>
            {activeChallenge.status === 'pending' && (
              <div className="moderation-notice">
                Задание находится на модерации. Ожидайте проверки.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-active-challenge">
          <h2>АКТИВНЫХ ЗАДАНИЙ НЕТ</h2>
          <p>Перейдите на страницу "Взять задание" чтобы выбрать новое задание</p>
          <button 
            onClick={() => navigate('/main')}
            className="btn-take-challenge"
          >
            ВЗЯТЬ ЗАДАНИЕ
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTeamPage;