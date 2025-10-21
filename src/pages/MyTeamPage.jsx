import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './MyTeamPageStyles.css';
import VideoBackground from '../components/VideoBackground/VideoBackground';

const MyTeamPage = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [waitingModeration, setWaitingModeration] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      await loadTeamData();
      await loadLeaderboard();
    };
    
    loadInitialData();
    
    const interval = setInterval(() => {
      loadTeamData();
      loadLeaderboard();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadTeamData = async () => {
    try {
      const response = await api.getMyTeam();
      setTeamData(response);
      setHasActiveChallenge(!!response.activeChallenge);
      
      if (response.activeChallenge && response.activeChallenge.status === 'pending') {
        setWaitingModeration(true);
        setButtonsDisabled(true);
      } else {
        setWaitingModeration(false);
        setButtonsDisabled(false);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setMessage('Ошибка загрузки данных команды');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard();
      
      if (Array.isArray(response) && response.length > 0) {
        const sortedTeams = response.sort((a, b) => b.balance - a.balance);
        const teamsWithPosition = sortedTeams.map((team, index) => ({
          ...team,
          position: index + 1
        }));
        setLeaderboard(teamsWithPosition);
      } else {
        const fallbackTeams = [
          { id: 1, name: 'Bratishkinoff', balance: 100000, completed_challenges: 5 },
          { id: 2, name: 'Shadowkek', balance: 85000, completed_challenges: 4 },
          { id: 3, name: 'Levsha', balance: 72000, completed_challenges: 3 },
          { id: 4, name: 'Recrent', balance: 68000, completed_challenges: 3 }
        ];
        const sortedFallback = fallbackTeams.sort((a, b) => b.balance - a.balance);
        const fallbackWithPosition = sortedFallback.map((team, index) => ({
          ...team,
          position: index + 1
        }));
        setLeaderboard(fallbackWithPosition);
      }
    } catch (error) {
      console.error('Load leaderboard error:', error);
      const fallbackTeams = [
        { id: 1, name: 'Bratishkinoff', balance: 100000, completed_challenges: 5 },
        { id: 2, name: 'Shadowkek', balance: 85000, completed_challenges: 4 },
        { id: 3, name: 'Levsha', balance: 72000, completed_challenges: 3 },
        { id: 4, name: 'Recrent', balance: 68000, completed_challenges: 3 }
      ];
      const sortedFallback = fallbackTeams.sort((a, b) => b.balance - a.balance);
      const fallbackWithPosition = sortedFallback.map((team, index) => ({
        ...team,
        position: index + 1
      }));
      setLeaderboard(fallbackWithPosition);
    }
  };

  const completeChallenge = async () => {
    try {
      setButtonsDisabled(true);
      await api.completeChallenge();
      setMessage('Задание отправлено на модерацию! Ожидайте проверки.');
      setWaitingModeration(true);
      await loadTeamData();
      await loadLeaderboard();
    } catch (error) {
      console.error('Error completing challenge:', error);
      setMessage('Ошибка завершения задания');
      setButtonsDisabled(false);
    }
  };

  const cancelChallenge = async () => {
    try {
      setButtonsDisabled(true);
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
      await loadLeaderboard();
      setButtonsDisabled(false);
    } catch (error) {
      console.error('Error canceling challenge:', error);
      setMessage('Ошибка отмены задания');
      setButtonsDisabled(false);
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

  const getTeamDisplayName = () => {
    const teamName = teamData?.team?.name || user?.login || 'RECRENT';
    return teamName.toUpperCase();
  };

  const getCurrentTeamPosition = () => {
    const currentTeamName = getTeamDisplayName();
    const currentTeam = leaderboard.find(team => 
      team.name.toUpperCase() === currentTeamName
    );
    return currentTeam?.position || 1;
  };

  const getCurrentTeamCompletedChallenges = () => {
    const currentTeamName = getTeamDisplayName();
    const currentTeam = leaderboard.find(team => 
      team.name.toUpperCase() === currentTeamName
    );
    return currentTeam?.completed_challenges || teamData?.team?.completed_challenges || 0;
  };

  const getCurrentTeamBalance = () => {
    const currentTeamName = getTeamDisplayName();
    const currentTeam = leaderboard.find(team => 
      team.name.toUpperCase() === currentTeamName
    );
    return currentTeam?.balance || teamData?.team?.balance || 0;
  };

  const getRarityDisplayName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'ЭПИЧЕСКОЕ БЕЗУМСТВО';
      case 'rare': return 'ДЕРЗКИЙ ВЫЗОВ';
      case 'common': return 'ПРОСТАЯ ШАЛОСТЬ';
      case 'troll': return 'ПАКОСТЬ';
      default: return 'ЗАДАНИЕ';
    }
  };

  // ИСПРАВЛЕННАЯ функция для получения URL изображения - ТЕПЕРЬ СОВПАДАЕТ С AnimatedCard
  const getChallengeImage = (challenge) => {
    if (!challenge) return '/images/cards/common/common-1.jpg';
    
    const rarity = challenge.rarity || 'common';
    
    // ТЕПЕРЬ ПУТИ СОВПАДАЮТ С AnimatedCard.jsx
    switch(rarity) {
      case 'epic':
        return '/images/cards/epic/epic-1.jpg';
      case 'rare':
        return '/images/cards/rare/rare-1.jpg';
      case 'troll':
        return '/images/cards/mischief/mischief-1.jpg';
      case 'common':
      default:
        return '/images/cards/common/common-1.jpg';
    }
  };

  if (!teamData) {
    return (
      <div className="my-team-page">
        <VideoBackground />
        <div className="loading-container">
          Загрузка данных команды...
        </div>
      </div>
    );
  }

  const cancelInfo = getCancelInfo();
  const currentPosition = getCurrentTeamPosition();
  const currentCompletedChallenges = getCurrentTeamCompletedChallenges();
  const currentBalance = getCurrentTeamBalance();

  return (
    <div className="my-team-page">
      <VideoBackground />
      
      {/* Заголовок сдвинут левее */}
      <div className="team-header-title">
        КОМАНДА {getTeamDisplayName()}
      </div>
      
      <div className="team-container">
        {/* ЛЕВЫЙ БЛОК - ВСЕГДА БОЛЬШОЙ */}
        <div className="left-panel">
          <div className="current-task-title">
            ТЕКУЩЕЕ ЗАДАНИЕ
          </div>
          
          <div className="challenge-card-container">
            {hasActiveChallenge && teamData.activeChallenge ? (
              <>
                {waitingModeration ? (
                  <>
                    {/* Блок с фото даже при модерации */}
                    <div 
                      className="challenge-image-block"
                      style={{ 
                        backgroundImage: `url(${getChallengeImage(teamData.activeChallenge)})`,
                        backgroundColor: '#2a2a2a'
                      }}
                    >
                      <div className="challenge-reward-overlay">
                        <svg className="reward-svg" width="233" height="43" viewBox="0 0 233 43" fill="none">
                          <path d="M20.6797 0H212.68L232.68 43H0.679688L20.6797 0Z" fill="#FF5000" fillOpacity="0.8"/>
                        </svg>
                        <div className="challenge-reward-text">
                          +{teamData.activeChallenge.reward} РУБ.
                        </div>
                      </div>
                    </div>

                    <div className="challenge-title-block">
                      <div className="moderation-status">
                        ОЖИДАЕТ ПРОВЕРКИ
                      </div>
                    </div>

                    <div className="challenge-description-block">
                      <div className="moderation-description">
                        Проверяем условия выполнения.<br/>
                        Это может занять несколько минут
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Блок с фото из карточки */}
                    <div 
                      className="challenge-image-block"
                      style={{ 
                        backgroundImage: `url(${getChallengeImage(teamData.activeChallenge)})`,
                        backgroundColor: '#2a2a2a'
                      }}
                    >
                      <div className="challenge-reward-overlay">
                        <svg className="reward-svg" width="233" height="43" viewBox="0 0 233 43" fill="none">
                          <path d="M20.6797 0H212.68L232.68 43H0.679688L20.6797 0Z" fill="#FF5000" fillOpacity="0.8"/>
                        </svg>
                        <div className="challenge-reward-text">
                          +{teamData.activeChallenge.reward} РУБ.
                        </div>
                      </div>
                    </div>

                    {/* Блок с названием задания */}
                    <div className="challenge-title-block">
                      <div className="challenge-rarity">
                        {getRarityDisplayName(teamData.activeChallenge.rarity)}
                      </div>
                    </div>

                    {/* Блок с описанием задания */}
                    <div className="challenge-description-block">
                      {teamData.activeChallenge.description}
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Когда нет активного задания - показываем заглушку */
              <>
                <div 
                  className="challenge-image-block no-challenge-image"
                  style={{ 
                    backgroundImage: 'none',
                    backgroundColor: '#1a1a1a'
                  }}
                >
                  <div className="no-challenge-icon">📋</div>
                </div>

                <div className="challenge-title-block">
                  <div className="no-challenge-title">
                    НЕТ АКТИВНЫХ ЗАДАНИЙ
                  </div>
                </div>

                <div className="challenge-description-block">
                  <div className="no-challenge-description">
                    Вернитесь на страницу "Взять задание"<br/>
                    чтобы выбрать новое задание
                  </div>
                </div>
              </>
            )}
          </div>

          {hasActiveChallenge && teamData.activeChallenge && !waitingModeration && (
            <>
              <div className="buttons-container">
                <button 
                  className={`btn-done ${buttonsDisabled ? 'disabled' : ''}`}
                  onClick={completeChallenge}
                  disabled={buttonsDisabled}
                >
                  <span className="btn-done-text">
                    Выполнено
                  </span>
                </button>
                <button 
                  className={`btn-cancel ${buttonsDisabled ? 'disabled' : ''}`}
                  onClick={cancelChallenge}
                  disabled={buttonsDisabled}
                >
                  <span className="btn-cancel-text">
                    Отменить
                  </span>
                </button>
              </div>

              <div className="cancels-info-block">
                <div className="cancels-text">
                  Осталось бесплатных отмен:
                  <br/>
                  <span className="penalty-text">
                    (Последующие отмены: -20% от награды)
                  </span>
                </div>
                <div className="cancels-count">
                  {cancelInfo.freeCancelsLeft}/3
                </div>
              </div>
            </>
          )}
        </div>

        {/* ПРАВЫЙ БЛОК */}
        <div className="right-panel">
          {/* ОРАНЖЕВЫЙ БЛОК КОТЁЛ КОМАНДЫ */}
          <div className="balance-orange-block">
            <div className="balance-orange-text">
              КОТЁЛ КОМАНДЫ: {currentBalance.toLocaleString()} руб.
            </div>
          </div>

          {/* Блоки статистики */}
          <div className="stats-container">
            {/* Блок МЕСТО В ТАБЛИЦЕ */}
            <div className="stat-block">
              <div className="stat-text">
                МЕСТО В ТАБЛИЦЕ
              </div>
              <div className="stat-value">
                #{currentPosition}
              </div>
            </div>

            {/* Блок ВЫПОЛНЕНО ЗАДАНИЙ */}
            <div className="stat-block">
              <div className="stat-text">
                ВЫПОЛНЕНО ЗАДАНИЙ
              </div>
              <div className="stat-value">
                {currentCompletedChallenges}
              </div>
            </div>
          </div>

          {/* Большой блок КОТЛЫ КОМАНД */}
          <div className="leaderboard-main-block">
            <div className="leaderboard-title">
              КОТЛЫ КОМАНД
            </div>

            <div className="leaderboard-headers">
              <div className="header-team">
                Команда
              </div>
              <div className="header-tasks">
                Выполненные задания
              </div>
              <div className="header-balance">
                Баланс
              </div>
            </div>

            <div className="leaderboard-list">
              {Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                leaderboard.map((team, index) => (
                  <div key={team.id || team.name} className="leaderboard-row">
                    <div className="team-name">
                      {team.name.toUpperCase()}
                    </div>
                    <div className="team-tasks">
                      {team.completed_challenges || 0}
                    </div>
                    <div className="team-balance">
                      {team.balance?.toLocaleString()} руб.
                    </div>
                  </div>
                ))
              ) : (
                <div className="leaderboard-loading">
                  Загрузка данных команд...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamPage;