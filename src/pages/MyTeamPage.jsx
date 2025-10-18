import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './MyTeamPage.css';

const MyTeamPage = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [waitingModeration, setWaitingModeration] = useState(false);

  useEffect(() => {
    loadTeamData();
    loadAvailableChallenges();
    loadLeaderboard();
  }, []);

  const loadTeamData = async () => {
    try {
      const response = await api.getMyTeam();
      setTeamData(response);
      setHasActiveChallenge(!!response.activeChallenge);
      // Проверяем статус модерации
      if (response.activeChallenge && response.activeChallenge.status === 'pending') {
        setWaitingModeration(true);
      } else {
        setWaitingModeration(false);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setMessage('Ошибка загрузки данных команды');
    }
  };

  const loadAvailableChallenges = async () => {
    try {
      setLoading(true);
      const response = await api.getAvailableChallenges();
      
      if (response.hasActiveChallenge) {
        setHasActiveChallenge(true);
        setChallenges([]);
        // Проверяем статус модерации
        if (response.activeChallenge && response.activeChallenge.status === 'pending') {
          setWaitingModeration(true);
        }
      } else {
        setHasActiveChallenge(false);
        setWaitingModeration(false);
        setChallenges(response.challenges || []);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
      setMessage('Ошибка загрузки карточек');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboard(response);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const generateCards = async () => {
    try {
      setLoading(true);
      const response = await api.generateCards();
      setChallenges(response.challenges);
      setMessage('Карточки сгенерированы! Выберите задание.');
    } catch (error) {
      console.error('Error generating cards:', error);
      setMessage(error.response?.data?.error || 'Ошибка генерации карточек');
    } finally {
      setLoading(false);
    }
  };

  const selectChallenge = async (challenge) => {
    try {
      setSelectedChallenge(challenge);
      await api.selectChallenge(challenge.id);
      setMessage('Задание выбрано! Теперь его можно выполнять.');
      setHasActiveChallenge(true);
      setWaitingModeration(false);
      await loadTeamData();
    } catch (error) {
      console.error('Error selecting challenge:', error);
      setMessage(error.response?.data?.error || 'Ошибка выбора задания');
      setSelectedChallenge(null);
    }
  };

  const replaceCards = async () => {
    try {
      setLoading(true);
      await api.replaceChallenges();
      await loadAvailableChallenges();
      await loadTeamData();
      setMessage('Карточки заменены! Стоимость: 10,000 руб');
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error replacing cards:', error);
      setMessage(error.response?.data?.error || 'Ошибка замены карточек');
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async () => {
    try {
      await api.completeChallenge();
      setMessage('Задание отправлено на модерацию! Ожидайте проверки.');
      setHasActiveChallenge(true);
      setWaitingModeration(true);
      await loadTeamData();
      await loadAvailableChallenges();
      await loadLeaderboard();
    } catch (error) {
      console.error('Error completing challenge:', error);
      setMessage(error.response?.data?.error || 'Ошибка завершения задания');
    }
  };

  const cancelChallenge = async () => {
    try {
      const response = await api.cancelChallenge();
      const { penaltyApplied, penaltyAmount } = response;
      
      if (penaltyApplied) {
        setMessage(`Задание отменено. Штраф: -${penaltyAmount} руб`);
      } else {
        setMessage('Задание отменено (бесплатная отмена)');
      }
      
      setHasActiveChallenge(false);
      setWaitingModeration(false);
      await loadTeamData();
      await loadAvailableChallenges();
    } catch (error) {
      console.error('Error canceling challenge:', error);
      setMessage(error.response?.data?.error || 'Ошибка отмены задания');
    }
  };

  const getRarityDisplayName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'Эпическое безумство';
      case 'rare': return 'Дерзкий вызов';
      case 'common': return 'Простая шалость';
      case 'troll': return 'Пакость';
      default: return rarity;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'epic': return '#ff6b00';
      case 'rare': return '#4cc9f0';
      case 'common': return '#4ade80';
      case 'troll': return '#f72585';
      default: return '#cccccc';
    }
  };

  const getCancelInfo = () => {
    const cancelCount = teamData?.cancelCount || 0;
    const freeCancelsLeft = Math.max(0, 3 - cancelCount);
    
    return {
      freeCancelsLeft,
      nextCancelPenalty: cancelCount >= 3,
      usedCancels: cancelCount
    };
  };

  if (!teamData) {
    return (
      <div className="my-team-page">
        <div className="my-team-container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <div>Загрузка данных команды...</div>
          </div>
        </div>
      </div>
    );
  }

  const cancelInfo = getCancelInfo();

  return (
    <div className="my-team-page">
      <div className="my-team-container">
        <div className="team-header">
          <h1 className="team-title">Моя команда</h1>
          <div className="team-subtitle">{teamData.team?.name}</div>
        </div>

        {message && (
          <div style={{
            background: 'rgba(240, 165, 0, 0.1)',
            border: '1px solid #f0a500',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#f0a500',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div className="team-content">
          {/* Левая колонка */}
          <div className="left-column">
            {/* Текущее задание */}
            {(hasActiveChallenge && teamData.activeChallenge) && (
              <div className="current-task-card">
                <div className="task-type" style={{ color: getRarityColor(teamData.activeChallenge.rarity) }}>
                  {getRarityDisplayName(teamData.activeChallenge.rarity)}
                </div>
                <div className="task-reward">
                  {teamData.activeChallenge.reward > 0 ? `+${teamData.activeChallenge.reward} руб` : `${teamData.activeChallenge.reward} руб`}
                </div>
                <div className="task-title">{teamData.activeChallenge.title}</div>
                <div className="task-description">{teamData.activeChallenge.description}</div>
                
                {/* Статус модерации */}
                {waitingModeration && (
                  <div className="moderation-status">
                    <div className="status-waiting">🕐 Статус: ЖДЁТ МОДЕРАЦИИ</div>
                    <p className="status-description">
                      Задание отправлено на проверку модератору. Ожидайте подтверждения выполнения.
                    </p>
                  </div>
                )}
                
                <div className="task-actions">
                  {!waitingModeration ? (
                    <>
                      <button className="btn-complete" onClick={completeChallenge}>
                        Задание выполнено
                      </button>
                      <button className="btn-cancel" onClick={cancelChallenge}>
                        Отменить задание
                      </button>
                    </>
                  ) : (
                    <div className="moderation-blocked">
                      <p>⏳ Ожидайте модерации текущего задания</p>
                    </div>
                  )}
                </div>

                <div className="cancellation-info">
                  <div className="free-cancels">
                    Бесплатные отмены: 
                    <span className={`cancels-count ${cancelInfo.freeCancelsLeft === 0 ? 'no-cancels' : ''}`}>
                      {cancelInfo.freeCancelsLeft} из 3
                    </span>
                  </div>
                  {cancelInfo.nextCancelPenalty && (
                    <div className="penalty-info">
                      Следующая отмена: <span className="penalty-amount">Штраф -20% от награды</span>
                    </div>
                  )}
                  {!cancelInfo.nextCancelPenalty && cancelInfo.freeCancelsLeft > 0 && (
                    <div className="free-info">
                      Следующая отмена: <span className="free-amount">Бесплатно</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Доступные карточки */}
            {!hasActiveChallenge && (
              <div style={{ background: '#2a2a2a', border: '2px solid #444', borderRadius: '10px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ color: '#ffffff', margin: 0 }}>Доступные задания</h2>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {challenges.length === 0 ? (
                      <button 
                        onClick={generateCards}
                        disabled={loading}
                        style={{
                          background: '#333',
                          color: '#ffffff',
                          border: '1px solid #666',
                          padding: '12px 24px',
                          borderRadius: '5px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        {loading ? 'Генерация...' : 'Получить карточки'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          onClick={replaceCards}
                          disabled={loading || teamData.team?.balance < 10000}
                          style={{
                            background: '#333',
                            color: teamData.team?.balance < 10000 ? '#666' : '#ffffff',
                            border: '1px solid #666',
                            padding: '12px 24px',
                            borderRadius: '5px',
                            cursor: (loading || teamData.team?.balance < 10000) ? 'not-allowed' : 'pointer',
                            opacity: (loading || teamData.team?.balance < 10000) ? 0.6 : 1
                          }}
                        >
                          {loading ? 'Замена...' : 'Заменить карточки'}
                        </button>
                        <div style={{ fontSize: '0.8rem', color: '#cccccc', textAlign: 'right' }}>
                          Стоимость замены карт испытаний: 10 000 руб.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#cccccc' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                    Загрузка карточек...
                  </div>
                ) : challenges.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {challenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        style={{
                          background: '#333',
                          border: `2px solid ${selectedChallenge?.id === challenge.id ? getRarityColor(challenge.rarity) : '#444'}`,
                          borderRadius: '8px',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          transform: selectedChallenge?.id === challenge.id ? 'scale(1.02)' : 'scale(1)'
                        }}
                        onClick={() => selectChallenge(challenge)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ color: getRarityColor(challenge.rarity), fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {getRarityDisplayName(challenge.rarity)}
                          </span>
                          <span style={{ color: challenge.reward > 0 ? '#ffd700' : '#ff6b6b', fontWeight: 'bold' }}>
                            {challenge.reward > 0 ? `+${challenge.reward} руб` : `${challenge.reward} руб`}
                          </span>
                        </div>
                        <h3 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                          {challenge.title}
                        </h3>
                        <p style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1rem' }}>
                          {challenge.description}
                        </p>
                        <button 
                          style={{
                            width: '100%',
                            background: selectedChallenge?.id === challenge.id ? getRarityColor(challenge.rarity) : '#444',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          {selectedChallenge?.id === challenge.id ? 'Выбрано' : 'Выбрать'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#cccccc' }}>
                    <p>Нет доступных карточек. Нажмите "Получить карточки" чтобы начать.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правая колонка */}
          <div className="right-column">
            <div className="balance-card">
              <div className="balance-title">Текущий баланс</div>
              <div className="balance-amount">{teamData.team?.balance?.toLocaleString()} руб</div>
            </div>

            <div className="stats-card">
              <div className="stat-item">
                <div className="stat-label">Выполнено</div>
                <div className="stat-value">{teamData.team?.completed_challenges || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Отмены</div>
                <div className="stat-value">{teamData.cancelCount || 0}</div>
              </div>
            </div>

            {/* Счетчик бесплатных отмен */}
            <div className="cancels-card">
              <div className="cancels-title">Бесплатные отмены</div>
              <div className="cancels-visual">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`cancel-indicator ${num <= cancelInfo.freeCancelsLeft ? 'active' : 'used'}`}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="cancels-info">
                {cancelInfo.freeCancelsLeft > 0 ? (
                  <span className="free-text">Осталось {cancelInfo.freeCancelsLeft} бесплатных отмен</span>
                ) : (
                  <span className="penalty-text">Далее штраф -20%</span>
                )}
              </div>
            </div>

            <div className="leaderboard-card">
              <div className="leaderboard-title">Турнирная таблица</div>
              <div className="leaderboard-header">
                <div>Команда</div>
                <div>Выполнено</div>
                <div>Баланс</div>
              </div>
              <div className="leaderboard-list">
                {leaderboard.slice(0, 5).map((team, index) => (
                  <div key={team.name} className="leaderboard-item">
                    <div className="item-team">{team.name}</div>
                    <div className="item-completed">{team.completed_challenges || 0}</div>
                    <div className="item-balance">{team.balance?.toLocaleString()} руб</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamPage;