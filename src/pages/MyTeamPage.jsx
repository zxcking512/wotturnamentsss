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
    
    // Обновляем данные каждые 3 секунды для моментального обновления
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
      // Используем endpoint leaderboard который доступен всем пользователям
      const response = await api.getLeaderboard();
      console.log('Leaderboard data:', response);
      
      if (Array.isArray(response) && response.length > 0) {
        // Сортируем команды по балансу (от большего к меньшему)
        const sortedTeams = response.sort((a, b) => b.balance - a.balance);
        // Добавляем позицию каждой команде
        const teamsWithPosition = sortedTeams.map((team, index) => ({
          ...team,
          position: index + 1
        }));
        setLeaderboard(teamsWithPosition);
      } else {
        console.error('Leaderboard response is empty or not array:', response);
        // Используем данные из teamData как fallback
        if (teamData && teamData.team) {
          const fallbackTeams = [
            { name: teamData.team.name, completed_challenges: teamData.team.completed_challenges || 0, balance: teamData.team.balance || 0 }
          ];
          setLeaderboard(fallbackTeams.map((team, index) => ({ ...team, position: 1 })));
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Fallback на данные текущей команды
      if (teamData && teamData.team) {
        const fallbackTeams = [
          { name: teamData.team.name, completed_challenges: teamData.team.completed_challenges || 0, balance: teamData.team.balance || 0 }
        ];
        setLeaderboard(fallbackTeams.map((team, index) => ({ ...team, position: 1 })));
      }
    }
  };

  const completeChallenge = async () => {
    try {
      setButtonsDisabled(true);
      await api.completeChallenge();
      setMessage('Задание отправлено на модерацию! Ожидайте проверки.');
      setWaitingModeration(true);
      // Мгновенно обновляем данные
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
      // Мгновенно обновляем данные
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

  // Находим текущую позицию команды в рейтинге
  const getCurrentTeamPosition = () => {
    const currentTeamName = getTeamDisplayName();
    const currentTeam = leaderboard.find(team => 
      team.name.toUpperCase() === currentTeamName
    );
    return currentTeam?.position || 1;
  };

  // Находим выполненные задания текущей команды
  const getCurrentTeamCompletedChallenges = () => {
    const currentTeamName = getTeamDisplayName();
    const currentTeam = leaderboard.find(team => 
      team.name.toUpperCase() === currentTeamName
    );
    return currentTeam?.completed_challenges || teamData?.team?.completed_challenges || 0;
  };

  // Находим баланс текущей команды
  const getCurrentTeamBalance = () => {
    const currentTeamName = getTeamDisplayName();
    const currentTeam = leaderboard.find(team => 
      team.name.toUpperCase() === currentTeamName
    );
    return currentTeam?.balance || teamData?.team?.balance || 0;
  };

  if (!teamData) {
    return (
      <div className="my-team-page" style={{
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"MT Sans LC Test 3 VF", Arial, sans-serif',
        color: '#FFF',
        position: 'relative',
        zIndex: '1'
      }}>
        <VideoBackground />
        <div style={{ position: 'relative', zIndex: '2' }}>
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
    <div className="my-team-page" style={{
      minHeight: '100vh',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      fontFamily: '"MT Sans LC Test 3 VF", Arial, sans-serif',
      color: '#FFF',
      position: 'relative',
      zIndex: '1'
    }}>
      <VideoBackground />
      
      {/* Заголовок КОМАНДА - слева над блоками */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '2rem', // Начинается от левого края
        color: '#FFF',
        fontFamily: '"MT Sans LC Test 3 VF"',
        fontSize: '68px',
        fontWeight: '350',
        lineHeight: 'normal',
        textTransform: 'uppercase',
        textAlign: 'left',
        zIndex: '3',
        whiteSpace: 'nowrap' // Одна строка
      }}>
        КОМАНДА {getTeamDisplayName()}
      </div>
      
      <div className="team-container" style={{
        display: 'flex',
        gap: '2rem',
        maxWidth: '1400px',
        width: '100%',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: '2',
        marginTop: '120px' // Больший отступ для заголовка
      }}>
        {/* ЛЕВЫЙ БЛОК */}
        <div className="left-panel" style={{
          width: '444px',
          height: '741px',
          padding: '40px 45px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          flexShrink: '0',
          border: '1px solid #FF5000',
          background: 'linear-gradient(180deg, rgba(49, 49, 49, 0.80) 0%, rgba(15, 15, 15, 0.90) 100%)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="current-task-title" style={{
            height: '51.073px',
            width: '100%',
            color: '#FFF',
            textAlign: 'center',
            fontFamily: '"MT Sans LC Test 3 VF"',
            fontSize: '42px',
            fontWeight: '350',
            lineHeight: 'normal',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}>
            ТЕКУЩЕЕ ЗАДАНИЕ
          </div>
          
          {/* КАРТОЧКА ЗАДАНИЯ */}
          <div className="task-inner-block" style={{
            width: '354px',
            height: '300px',
            flexShrink: '0',
            border: '3px solid #FF5000',
            background: 'radial-gradient(50% 50% at 50% 50%, rgba(18, 18, 18, 0.76) 0%, rgba(18, 18, 18, 0.95) 100%)',
            borderRadius: '12px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>
            {hasActiveChallenge && teamData.activeChallenge ? (
              <>
                {waitingModeration ? (
                  <>
                    <div className="moderation-title" style={{
                      color: '#FFF',
                      textAlign: 'center',
                      fontFamily: '"MT Sans LC Test 3 VF"',
                      fontSize: '32px',
                      fontWeight: '350',
                      lineHeight: 'normal',
                      margin: '0'
                    }}>
                      ЗАДАНИЕ НА МОДЕРАЦИИ
                    </div>
                    <div style={{
                      color: '#FFF', 
                      textAlign: 'center', 
                      fontSize: '16px',
                      fontFamily: '"MT Sans LC Test 3 VF"',
                      lineHeight: '1.4'
                    }}>
                      Проверяем условия выполнения.<br/>
                      Это может занять несколько минут
                    </div>
                  </>
                ) : (
                  <>
                    <div className="moderation-title" style={{
                      color: '#FF5000',
                      textAlign: 'center',
                      fontFamily: '"MT Sans LC Test 3 VF"',
                      fontSize: '28px',
                      fontWeight: '350',
                      lineHeight: 'normal',
                      margin: '0'
                    }}>
                      {teamData.activeChallenge.rarity === 'epic' ? 'ЭПИЧЕСКОЕ БЕЗУМСТВО' : 
                       teamData.activeChallenge.rarity === 'rare' ? 'ДЕРЗКИЙ ВЫЗОВ' : 
                       teamData.activeChallenge.rarity === 'common' ? 'ПРОСТАЯ ШАЛОСТЬ' : 'ПАКОСТЬ'}
                    </div>
                    
                    <div style={{
                      color: '#FFD700', 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      fontFamily: '"MT Sans LC Test 3 VF"',
                      textAlign: 'center'
                    }}>
                      +{teamData.activeChallenge.reward} РУБ.
                    </div>
                    
                    <div style={{
                      color: '#FFF', 
                      textAlign: 'center', 
                      fontSize: '16px',
                      fontFamily: '"MT Sans LC Test 3 VF"',
                      lineHeight: '1.4'
                    }}>
                      {teamData.activeChallenge.description}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{
                color: '#FFF', 
                textAlign: 'center', 
                fontSize: '18px',
                fontFamily: '"MT Sans LC Test 3 VF"',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                Нет активных заданий
              </div>
            )}
          </div>

          {/* КНОПКИ - ВНЕ КАРТОЧКИ (ВСЕГДА ПОКАЗЫВАЕМ, НО ДЕЛАЕМ НЕАКТИВНЫМИ) */}
          {hasActiveChallenge && teamData.activeChallenge && (
            <>
              <div className="buttons-container" style={{
                display: 'flex',
                gap: '20px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <button 
                  className="btn-done" 
                  onClick={completeChallenge}
                  disabled={buttonsDisabled || waitingModeration}
                  style={{
                    width: '182px',
                    height: '54px',
                    flexShrink: '0',
                    background: (buttonsDisabled || waitingModeration) ? '#666' : '#313131',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (buttonsDisabled || waitingModeration) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: (buttonsDisabled || waitingModeration) ? 0.6 : 1
                  }}
                >
                  <span className="btn-done-text" style={{
                    width: '182px',
                    height: '23.564px',
                    flexShrink: '0',
                    color: '#FFF',
                    textAlign: 'center',
                    fontFamily: '"MT Sans LC Test 3 VF"',
                    fontSize: '20px',
                    fontWeight: '100',
                    lineHeight: 'normal',
                    margin: '0'
                  }}>
                    {waitingModeration ? 'ОЖИДАНИЕ...' : 'Выполнено'}
                  </span>
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={cancelChallenge}
                  disabled={buttonsDisabled || waitingModeration}
                  style={{
                    width: '150.788px',
                    height: '54px',
                    flexShrink: '0',
                    border: '2px solid #5A5A5A',
                    background: 'transparent',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (buttonsDisabled || waitingModeration) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: (buttonsDisabled || waitingModeration) ? 0.6 : 1
                  }}
                >
                  <span className="btn-cancel-text" style={{
                    width: '150.359px',
                    height: '23.577px',
                    flexShrink: '0',
                    color: '#FFF',
                    textAlign: 'center',
                    fontFamily: '"MT Sans LC Test 3 VF"',
                    fontSize: '20px',
                    fontWeight: '100',
                    lineHeight: 'normal',
                    margin: '0'
                  }}>
                    Отменить
                  </span>
                </button>
              </div>

              {/* ИНФОРМАЦИЯ ОБ ОТМЕНАХ - ВНЕ КАРТОЧКИ */}
              <div className="cancels-info-block" style={{
                display: 'flex',
                padding: '10px 20px',
                alignItems: 'center',
                gap: '5px',
                alignSelf: 'stretch',
                border: '1px solid #4B4B4B',
                borderRadius: '8px',
                background: 'rgba(75, 75, 75, 0.1)'
              }}>
                <div className="cancels-text" style={{
                  width: '230px',
                  color: '#FFF',
                  fontFamily: '"MT Sans LC Test 3 VF"',
                  fontSize: '16px',
                  fontWeight: '100',
                  lineHeight: 'normal',
                  margin: '0'
                }}>
                  Осталось бесплатных отмен:
                  <br/>
                  <span className="penalty-text" style={{
                    color: '#FE791A',
                    fontFamily: '"MT Sans LC Test 3 VF"',
                    fontSize: '16px',
                    fontWeight: '100',
                    lineHeight: 'normal'
                  }}>
                    (Последующие отмены: -10 000 руб.)
                  </span>
                </div>
                <div className="cancels-count" style={{
                  width: '79px',
                  color: '#FE791A',
                  textAlign: 'right',
                  fontFamily: '"MT Sans LC Test 3 VF"',
                  fontSize: '32px',
                  fontWeight: '350',
                  lineHeight: 'normal',
                  margin: '0'
                }}>
                  {cancelInfo.freeCancelsLeft}/3
                </div>
              </div>
            </>
          )}
        </div>

        {/* ПРАВЫЙ БЛОК */}
        <div className="right-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flex: '1'
        }}>
          {/* ОРАНЖЕВЫЙ БЛОК КОТЁЛ КОМАНДЫ - ВЕРНУЛ */}
          <div style={{
            width: '709px',
            height: '114px',
            flexShrink: '0',
            border: '1px solid #FE791A',
            background: 'rgba(255, 80, 0, 0.70)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '709px',
              height: '51px',
              flexShrink: '0',
              color: '#FFF',
              textAlign: 'center',
              fontFamily: '"MT Sans LC Test 3 VF"',
              fontSize: '42px',
              fontWeight: '350',
              lineHeight: '120%'
            }}>
              КОТЁЛ КОМАНДЫ: {currentBalance.toLocaleString()} руб.
            </div>
          </div>

          {/* Блоки МЕСТО В ТАБЛИЦЕ и ВЫПОЛНЕНО ЗАДАНИЙ */}
          <div style={{
            display: 'flex',
            gap: '20px',
            width: '100%'
          }}>
            {/* Блок МЕСТО В ТАБЛИЦЕ */}
            <div style={{
              display: 'flex',
              padding: '20px 25px',
              alignItems: 'center',
              gap: '30px',
              border: '1px solid #FFF',
              background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.40) 0%, rgba(69, 69, 69, 0.40) 100%)',
              borderRadius: '8px',
              flex: '1',
              height: '100px', // Уменьшил высоту
              justifyContent: 'space-between',
              minWidth: '0'
            }}>
              <div style={{
                color: '#FFF',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '22px', // Уменьшил шрифт
                fontWeight: '350',
                lineHeight: '120%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                МЕСТО В ТАБЛИЦЕ
              </div>
              <div style={{
                color: '#FFF',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '52px', // Уменьшил шрифт
                fontWeight: '350',
                lineHeight: '120%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                #{currentPosition}
              </div>
            </div>

            {/* Блок ВЫПОЛНЕНО ЗАДАНИЙ */}
            <div style={{
              display: 'flex',
              padding: '20px 25px',
              alignItems: 'center',
              gap: '30px',
              border: '1px solid #FFF',
              background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.40) 0%, rgba(69, 69, 69, 0.40) 100%)',
              borderRadius: '8px',
              flex: '1',
              height: '100px', // Уменьшил высоту
              justifyContent: 'space-between',
              minWidth: '0'
            }}>
              <div style={{
                color: '#FFF',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '22px', // Уменьшил шрифт
                fontWeight: '350',
                lineHeight: '120%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                ВЫПОЛНЕНО ЗАДАНИЙ
              </div>
              <div style={{
                color: '#FFF',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '52px', // Уменьшил шрифт
                fontWeight: '350',
                lineHeight: '120%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {currentCompletedChallenges}
              </div>
            </div>
          </div>

          {/* Большой блок КОТЛЫ КОМАНД */}
          <div style={{
            display: 'flex',
            width: '709px',
            height: '445px',
            padding: '45px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px',
            flexShrink: '0',
            border: '1px solid #FFF',
            background: 'linear-gradient(180deg, rgba(49, 49, 49, 0.80) 0%, rgba(15, 15, 15, 0.90) 100%)',
            borderRadius: '12px'
          }}>
            {/* Заголовок КОТЛЫ КОМАНД */}
            <div style={{
              height: '44px',
              flexShrink: '0',
              alignSelf: 'stretch',
              color: '#FFF',
              fontFamily: '"MT Sans LC Test 3 VF"',
              fontSize: '42px',
              fontWeight: '350',
              lineHeight: 'normal',
              textAlign: 'center'
            }}>
              КОТЛЫ КОМАНД
            </div>

            {/* Заголовки таблицы */}
            <div style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{
                flex: '1',
                color: '#C5C5C5',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '16px',
                fontWeight: '100',
                lineHeight: 'normal',
                textAlign: 'left'
              }}>
                Команда
              </div>
              <div style={{
                flex: '1',
                color: '#C5C5C5',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '16px',
                fontWeight: '100',
                lineHeight: 'normal',
                textAlign: 'center'
              }}>
                Выполненные задания
              </div>
              <div style={{
                flex: '1',
                color: '#C5C5C5',
                fontFamily: '"MT Sans LC Test 3 VF"',
                fontSize: '16px',
                fontWeight: '100',
                lineHeight: 'normal',
                textAlign: 'right'
              }}>
                Баланс
              </div>
            </div>

            {/* Список команд */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              width: '100%',
              marginTop: '10px',
              overflowY: 'auto',
              maxHeight: '280px'
            }}>
              {Array.isArray(leaderboard) && leaderboard.map((team, index) => (
                <div key={team.name} style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    flex: '1',
                    color: '#FFF',
                    fontFamily: '"MT Sans LC Test 3 VF"',
                    fontSize: '16px',
                    fontWeight: '350',
                    lineHeight: 'normal',
                    textAlign: 'left',
                    whiteSpace: 'nowrap', // Одна строка
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {team.name.toUpperCase()}
                  </div>
                  <div style={{
                    flex: '1',
                    color: '#FFF',
                    fontFamily: '"MT Sans LC Test 3 VF"',
                    fontSize: '16px',
                    fontWeight: '100',
                    lineHeight: 'normal',
                    textAlign: 'center'
                  }}>
                    {team.completed_challenges || 0}
                  </div>
                  <div style={{
                    flex: '1',
                    color: '#FFF',
                    fontFamily: '"MT Sans LC Test 3 VF"',
                    fontSize: '16px',
                    fontWeight: '100',
                    lineHeight: 'normal',
                    textAlign: 'right'
                  }}>
                    {team.balance?.toLocaleString()} руб.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamPage;