import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import api from '../services/api';
import AnimatedCard from '../components/AnimatedCard/AnimatedCard';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [hasActiveTask, setHasActiveTask] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [teams, setTeams] = useState([]);
  const [myTeamData, setMyTeamData] = useState(null);
  const [replacingCards, setReplacingCards] = useState(false);
  const [completedMischiefCards, setCompletedMischiefCards] = useState(new Set());
  const [acceptedTaskCard, setAcceptedTaskCard] = useState(null);
  
  // НОВЫЕ СОСТОЯНИЯ ДЛЯ ЛОГИКИ ОТКРЫТИЯ
  const [openedCardId, setOpenedCardId] = useState(null);
  const [openedCardRarity, setOpenedCardRarity] = useState(null);

  useEffect(() => {
    loadAllData();
    
    const interval = setInterval(() => {
      loadTeams();
      loadMyTeamData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadChallenges(),
      loadTeams(),
      loadMyTeamData()
    ]);
  };

  const loadMyTeamData = async () => {
    try {
      const response = await api.getMyTeam();
      setMyTeamData(response);
    } catch (error) {
      console.error('Load my team data error:', error);
    }
  };

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.getAvailableChallenges();
      
      if (response.hasActiveChallenge) {
        setHasActiveTask(true);
        setActiveTask(response.activeChallenge);
        
        const fakeCards = [
          {
            id: 1,
            uniqueKey: 'card_1',
            rarity: 'common',
            title: 'Карта 1',
            description: 'Описание карты 1',
            reward: 25000,
            isFake: true
          },
          {
            id: 2,
            uniqueKey: 'card_2', 
            rarity: 'epic',
            title: 'Карта 2',
            description: 'Описание карты 2',
            reward: 50000,
            isFake: true
          },
          {
            id: 3,
            uniqueKey: 'card_3',
            rarity: 'troll', 
            title: 'Карта 3',
            description: 'Описание карты 3',
            reward: -10000,
            isFake: true
          }
        ];
        setCards(fakeCards);
      } else {
        setHasActiveTask(false);
        setActiveTask(null);
        setAcceptedTaskCard(null);
        // СБРАСЫВАЕМ СОСТОЯНИЯ ПРИ ЗАГРУЗКЕ НОВЫХ КАРТ
        setOpenedCardId(null);
        setOpenedCardRarity(null);
        const cardsWithAnimationState = (response.challenges || []).map((card, index) => ({
          ...card,
          isReplacing: false,
          uniqueKey: `${card.id}_${index}_${Date.now()}`
        }));
        setCards(cardsWithAnimationState);
      }
    } catch (error) {
      console.error('Load challenges error:', error);
      setError('Ошибка загрузки заданий: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  // НОВАЯ ФУНКЦИЯ: обработка открытия карточки
  const handleCardOpen = (cardId, rarity) => {
    console.log('Card opened:', cardId, rarity);
    setOpenedCardId(cardId);
    setOpenedCardRarity(rarity);
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: проверка блокировки карточки
  const isCardBlocked = (card) => {
    // Если нет открытой карты - ничего не блокируем
    if (openedCardId === null) {
      return false;
    }
    
    // БЛОКИРУЕМ ВСЕ карты кроме открытой
    return card.uniqueKey !== openedCardId;
  };

  const loadTeams = async () => {
    try {
      const response = await api.getLeaderboard();
      
      if (Array.isArray(response) && response.length > 0) {
        const sortedTeams = response
          .sort((a, b) => b.balance - a.balance)
          .map(team => ({
            ...team,
            name: team.name.charAt(0).toUpperCase() + team.name.slice(1).toLowerCase()
          }));
        setTeams(sortedTeams);
      } else {
        const fallbackTeams = [
          { id: 1, name: 'Bratishkinoff', balance: 100000, completed_challenges: 0 },
          { id: 2, name: 'Shadowkek', balance: 100000, completed_challenges: 0 },
          { id: 3, name: 'Levsha', balance: 100000, completed_challenges: 0 },
          { id: 4, name: 'Recrent', balance: 100000, completed_challenges: 0 }
        ];
        setTeams(fallbackTeams);
      }
    } catch (error) {
      console.error('Load teams error:', error);
      const fallbackTeams = [
        { id: 1, name: 'Bratishkinoff', balance: 100000, completed_challenges: 0 },
        { id: 2, name: 'Shadowkek', balance: 100000, completed_challenges: 0 },
        { id: 3, name: 'Levsha', balance: 100000, completed_challenges: 0 },
        { id: 4, name: 'Recrent', balance: 100000, completed_challenges: 0 }
      ];
      setTeams(fallbackTeams);
    }
  };

  const handleTakeTask = async (card, selectedTeamId = null) => {
    if (!card || hasActiveTask || loading) return;

    try {
      let response;
      
      if (card.rarity === 'troll') {
        if (!selectedTeamId) {
          setError('Пожалуйста, выберите команду для пакости!');
          return;
        }
        response = await api.selectMischiefTarget(card.id, parseInt(selectedTeamId));
        
        if (response.success) {
          // Добавляем карточку в множество завершенных пакостей
          setCompletedMischiefCards(prev => new Set([...prev, card.uniqueKey]));
          setSuccessMessage(`Пакость "${card.title}" выполнена!`);
          setTimeout(() => setSuccessMessage(''), 3000);
          
          // СБРАСЫВАЕМ СОСТОЯНИЯ ОТКРЫТИЯ ПОСЛЕ УСПЕШНОГО ВЫПОЛНЕНИЯ ПАКОСТИ
          setOpenedCardId(null);
          setOpenedCardRarity(null);
          
          // ТРИГГЕРИМ ОБНОВЛЕНИЕ БАЛАНСА
          setTimeout(() => {
            window.dispatchEvent(new Event('balanceUpdate'));
          }, 500);
          
          // Не загружаем все данные заново, чтобы не сбрасывать состояние
          await loadTeams(); // Обновляем только балансы команд
          await loadMyTeamData(); // Обновляем данные своей команды
        }
      } else {
        response = await api.selectChallenge(card.id);
        
        if (response.success) {
          // Сохраняем выбранную карточку как принятую
          setAcceptedTaskCard(card);
          setHasActiveTask(true);
          setSuccessMessage(`Задание "${card.title}" принято!`);
          setTimeout(() => setSuccessMessage(''), 3000);
          
          // ТРИГГЕРИМ ОБНОВЛЕНИЕ БАЛАНСА
          setTimeout(() => {
            window.dispatchEvent(new Event('balanceUpdate'));
          }, 500);
          
          // Создаем фейковые карточки для отображения
          const fakeCards = [
            {
              id: 1,
              uniqueKey: 'card_1',
              rarity: 'common',
              title: 'Карта 1',
              description: 'Описание карты 1',
              reward: 25000,
              isFake: true
            },
            {
              id: 2,
              uniqueKey: 'card_2', 
              rarity: 'epic',
              title: 'Карта 2',
              description: 'Описание карты 2',
              reward: 50000,
              isFake: true
            },
            {
              id: 3,
              uniqueKey: 'card_3',
              rarity: 'troll', 
              title: 'Карта 3',
              description: 'Описание карты 3',
              reward: -10000,
              isFake: true
            }
          ];
          setCards(fakeCards);
        }
      }
    } catch (error) {
      console.error('Take task error:', error);
      setError('Ошибка при выборе задания: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleTeamSelect = (card, teamId) => {
    console.log(`Selected team ${teamId} for card ${card.id}`);
  };

  const handleReplaceCards = async () => {
    if (hasActiveTask || loading || replacingCards) {
      alert('Нельзя заменять карточки при активном задании!');
      return;
    }

    try {
      setReplacingCards(true);
      setLoading(true);
      
      // Сбрасываем состояние завершенных пакостей при замене
      setCompletedMischiefCards(new Set());
      // СБРАСЫВАЕМ СОСТОЯНИЯ ОТКРЫТИЯ ПРИ ЗАМЕНЕ
      setOpenedCardId(null);
      setOpenedCardRarity(null);
      
      setCards(prevCards => 
        prevCards.map(card => ({ ...card, isReplacing: true }))
      );
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await api.replaceChallenges();
      
      if (response.success) {
        await loadChallenges();
        // УБРАЛИ СООБЩЕНИЕ О ЗАМЕНЕ КАРТОЧЕК
        setTimeout(() => {
          window.dispatchEvent(new Event('balanceUpdate'));
        }, 500);
      }
    } catch (error) {
      console.error('Replace cards error:', error);
      if (error.message?.includes('Недостаточно средств')) {
        setError('Недостаточно средств для замены карточек!');
      } else {
        setError('Ошибка при замене карточек: ' + (error.message || 'Неизвестная ошибка'));
      }
      await loadChallenges();
    } finally {
      setLoading(false);
      setReplacingCards(false);
    }
  };

  const handleCardReplaceComplete = (uniqueKey) => {
    setCards(prevCards => prevCards.filter(card => card.uniqueKey !== uniqueKey));
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const renderActiveTaskView = () => {
    return (
      <div className="active-task-container">
        <div className="active-task-cards-grid">
          {cards.map((card, index) => (
            <AnimatedCard
              key={card.uniqueKey}
              challenge={card}
              onSelect={handleTakeTask}
              onTeamSelect={handleTeamSelect}
              teams={teams.filter(team => team.id !== (myTeamData?.team?.id))}
              canSelect={false}
              isReplacing={false}
              isMischiefCompleted={completedMischiefCards.has(card.uniqueKey)}
              isTaskAccepted={acceptedTaskCard && acceptedTaskCard.uniqueKey === card.uniqueKey}
              isBlocked={false}
              onCardOpen={handleCardOpen}
            />
          ))}
        </div>

        <div className="active-task-notification-block">
          <div className="active-task-title">
            У ВАС УЖЕ ЕСТЬ АКТИВНОЕ ЗАДАНИЕ!
          </div>
          <div className="active-task-message">
            Отметить, как выполненное или отменить текущее задание вы можете на странице "Моя команда". Если задание на модерации, дождитесь его окончания
          </div>
          <button
            onClick={() => navigate('/my-team')}
            className="active-task-button"
          >
            МОЯ КОМАНДА
          </button>
        </div>

        <div className="replace-section">
          <button 
            onClick={handleReplaceCards}
            className="replace-btn"
            disabled={true}
          >
            <span className="replace-text">
              Заменить карты
            </span>
            <div className="reroll-icon-container">
              <img 
                src="/images/icons/icon-4.png" 
                alt="Reroll" 
                className="reroll-icon"
                onError={(e) => {
                  // Fallback если изображение не загрузится
                  e.target.style.display = 'none';
                  e.target.nextSibling?.remove();
                  const text = document.createElement('span');
                  text.textContent = '⟳';
                  text.style.color = 'white';
                  text.style.fontSize = '20px';
                  text.style.fontWeight = 'bold';
                  e.target.parentNode.appendChild(text);
                }}
              />
            </div>
          </button>
          <div className="replace-cost">
            <div className="cost-text-container">
              <div className="cost-text-line">Стоимость каждой</div>
              <div className="cost-text-line">замены карт испытаний</div>
            </div>
            <div className="cost-amount">-5 000 РУБ.</div>
          </div>
        </div>
      </div>
    );
  };

  const renderNormalView = () => {
    if (loading && !replacingCards) {
        return <div className="loading">Обновление карточек...</div>;
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={loadChallenges} className="retry-btn">
            Попробовать снова
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="cards-grid-container">
          <div className="cards-grid">
            {cards.length === 0 && !replacingCards ? (
              <div className="no-cards-message">
                <h3>Нет доступных заданий</h3>
                <p>Попробуйте обновить страницу или обратитесь к модератору</p>
                <button onClick={loadChallenges} className="retry-btn">
                  Обновить
                </button>
              </div>
            ) : (
              cards.map((card) => (
                <AnimatedCard
                  key={card.uniqueKey}
                  challenge={card}
                  onSelect={handleTakeTask}
                  onTeamSelect={handleTeamSelect}
                  teams={teams.filter(team => team.id !== (myTeamData?.team?.id))}
                  canSelect={!loading && !replacingCards}
                  isReplacing={card.isReplacing}
                  onReplaceComplete={() => handleCardReplaceComplete(card.uniqueKey)}
                  isMischiefCompleted={completedMischiefCards.has(card.uniqueKey)}
                  isTaskAccepted={false}
                  isBlocked={isCardBlocked(card)}
                  onCardOpen={handleCardOpen}
                />
              ))
            )}
          </div>
        </div>

        {/* БЛОК ЗАМЕНЫ КАРТ ВСЕГДА ОТОБРАЖАЕТСЯ В НОРМАЛЬНОМ РЕЖИМЕ */}
        <div className="replace-section">
          <button 
            onClick={handleReplaceCards}
            className="replace-btn"
            disabled={loading || replacingCards || (myTeamData && myTeamData.team && myTeamData.team.balance < 5000)}
          >
            <span className="replace-text">
              {replacingCards ? 'Замена...' : 'Заменить карты'}
            </span>
            <div className="reroll-icon-container">
              <img 
                src="/images/icons/icon-4.png" 
                alt="Reroll" 
                className="reroll-icon"
                onError={(e) => {
                  // Fallback если изображение не загрузится
                  e.target.style.display = 'none';
                  e.target.nextSibling?.remove();
                  const text = document.createElement('span');
                  text.textContent = '⟳';
                  text.style.color = 'white';
                  text.style.fontSize = '20px';
                  text.style.fontWeight = 'bold';
                  e.target.parentNode.appendChild(text);
                }}
              />
            </div>
          </button>
          <div className="replace-cost">
            <div className="cost-text-container">
              <div className="cost-text-line">Стоимость каждой</div>
              <div className="cost-text-line">замены карт испытаний</div>
            </div>
            <div className="cost-amount">-5 000 РУБ.</div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="main-page">
      {successMessage && <div className="successMessage">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="main-container">
        
        <div className="left-column">
          <div className="cards-actions-block">
            <div className="block-title">КАРТЫ И ДЕЙСТВИЯ</div>
            <div className="title-divider"></div>
            
            <div className="action-item">
              <div className="action-icon-container">
                <img 
                  src="/images/icons/icon-1.svg" 
                  alt="Эпическое безумие" 
                  className="action-icon"
                />
              </div>
              <div className="action-content">
                <div className="action-name">ЭПИЧЕСКОЕ БЕЗУМСТВИЕ</div>
                <div className="action-reward">+50 000 руб.</div>
              </div>
            </div>
            
            <div className="action-item">
              <div className="action-icon-container">
                <img 
                  src="/images/icons/icon-2.svg" 
                  alt="Простая шалость" 
                  className="action-icon"
                />
              </div>
              <div className="action-content">
                <div className="action-name">ПРОСТАЯ ШАЛОСТЬ</div>
                <div className="action-reward">+25 000 руб.</div>
              </div>
            </div>
            
            <div className="action-item">
              <div className="action-icon-container">
                <img 
                  src="/images/icons/icon-3.svg" 
                  alt="Пакость противнику" 
                  className="action-icon"
                />
              </div>
              <div className="action-content">
                <div className="action-name">ПАКОСТЬ ПРОТИВНИКУ</div>
                <div className="action-reward">-10 000 руб.</div>
              </div>
            </div>
            
            <div className="action-item">
              <div className="action-icon-container">
                <img 
                  src="/images/icons/icon-4.svg" 
                  alt="Замена карт" 
                  className="action-icon"
                />
              </div>
              <div className="action-content">
                <div className="action-name">ЗАМЕНА КАРТ</div>
                <div className="action-reward">-5 000 руб.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="center-column">
          {hasActiveTask ? renderActiveTaskView() : renderNormalView()}
        </div>

        <div className="right-column">
          <div className="teams-rating-block">
            <div className="teams-rating-title">ТУРНИРНАЯ ТАБЛИЦА</div>
            <div className="teams-rating-divider"></div>
            
            <div className="teams-rating-list">
              {teams.length > 0 ? (
                teams.map((team, index) => (
                  <div key={team.id || team.name} className="teams-rating-item">
                    <div className="teams-rating-icon-container">
                      <img 
                        src="/images/icons/icon-52.svg" 
                        alt={team.name} 
                        className="teams-rating-icon"
                      />
                    </div>
                    <div className="teams-rating-content">
                      <div className="teams-rating-name">{team.name}</div>
                      <div className="teams-rating-balance">{formatBalance(team.balance)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-teams-message">
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

export default MainPage;