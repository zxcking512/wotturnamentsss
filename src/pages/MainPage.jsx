import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import api from '../services/api';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [selectedTeamForMischief, setSelectedTeamForMischief] = useState('');
  const [teamsData, setTeamsData] = useState([]);
  const [hasActiveTask, setHasActiveTask] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChallenges();
    loadTeamsData();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await api.getAvailableChallenges();
      
      if (response.hasActiveChallenge) {
        setHasActiveTask(true);
        setActiveTask(response.activeChallenge);
      } else {
        setHasActiveTask(false);
        setCards(response.challenges || []);
      }
    } catch (error) {
      setError('Ошибка загрузки заданий');
      console.error('Load challenges error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsData = async () => {
    try {
      // Для капитана получаем данные через модераторский API
      if (user?.role === 'captain') {
        const response = await api.getTeams();
        setTeamsData(response.map(team => ({
          id: team.id,
          name: team.name,
          balance: new Intl.NumberFormat('ru-RU').format(team.balance) + ' руб.'
        })).filter(team => team.id !== user.team_id)); // Исключаем свою команду
      }
    } catch (error) {
      console.error('Load teams error:', error);
      // Fallback данные
      setTeamsData([
        { id: 1, name: 'RECRENT', balance: '150 000 руб.' },
        { id: 2, name: 'BRATISHKOFF', balance: '150 000 руб.' },
        { id: 3, name: 'SHADOWKEKW', balance: '100 000 руб.' },
        { id: 4, name: 'LEVSHA', balance: '50 000 руб.' }
      ]);
    }
  };

  const handleCardClick = (cardIndex) => {
    if (hasActiveTask || loading) return;
    
    const updatedCards = [...cards];
    updatedCards[cardIndex].isOpen = true;
    setCards(updatedCards);
    setSelectedCard(updatedCards[cardIndex]);
  };

  const handleTakeTask = async (card) => {
    if (!card || hasActiveTask || loading) return;

    try {
      if (card.rarity === 'troll') {
        setShowTeamSelect(true);
        return;
      }

      const response = await api.selectChallenge(card.id);
      if (response.success) {
        setHasActiveTask(true);
        alert(`Задание "${card.title}" принято!`);
        navigate('/my-team');
      }
    } catch (error) {
      setError('Ошибка при выборе задания');
      console.error('Take task error:', error);
    }
  };

  const handleMischiefConfirm = async () => {
    if (!selectedTeamForMischief) {
      alert('Выберите команду для пакости!');
      return;
    }

    try {
      // Находим выбранную команду
      const targetTeam = teamsData.find(team => team.name === selectedTeamForMischief);
      if (!targetTeam) {
        throw new Error('Команда не найдена');
      }

      // Выполняем пакость через API
      const response = await api.selectChallenge(selectedCard.id);
      if (response.success) {
        // Обновляем баланс команды через модераторский API
        await api.updateTeam(targetTeam.id, {
          balance: parseInt(targetTeam.balance.replace(/\D/g, '')) - 10000
        });

        alert(`Пакость совершена! Команда ${selectedTeamForMischief} теряет 10 000 руб.`);
        
        setShowTeamSelect(false);
        setSelectedTeamForMischief('');
        setSelectedCard(null);
        await loadChallenges();
        await loadTeamsData(); // Обновляем данные команд
      }
    } catch (error) {
      setError('Ошибка при выполнении пакости');
      console.error('Mischief error:', error);
    }
  };

  const handleReplaceCards = async () => {
    if (hasActiveTask || loading) {
      alert('Нельзя заменять карточки при активном задании!');
      return;
    }

    try {
      const response = await api.replaceChallenges();
      if (response.success) {
        await loadChallenges();
        alert('Карточки заменены! Спиcано 10 000 руб.');
      }
    } catch (error) {
      if (error.message.includes('Недостаточно средств')) {
        alert('Недостаточно средств для замены карточек!');
      } else {
        setError('Ошибка при замене карточек');
        console.error('Replace cards error:', error);
      }
    }
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'epic': return 'epic';
      case 'rare': return 'rare';
      case 'common': return 'common';
      case 'troll': return 'mischief';
      default: return 'common';
    }
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'ЭПИЧЕСКОЕ БЕЗУМСТВО';
      case 'rare': return 'ДЕРЗКИЙ ВЫЗОВ';
      case 'common': return 'ПРОСТАЯ ШАЛОСТЬ';
      case 'troll': return 'ПАКОСТЬ';
      default: return rarity;
    }
  };

  const renderActiveTaskBlock = () => {
    return (
      <div className="active-task-notification">
        <div className="notification-content">
          <h2>У ВАС УЖЕ ЕСТЬ АКТИВНОЕ ЗАДАНИЕ!</h2>
          <p>Отметить как выполненное или отменить текущее задание вы можете на странице "Моя команда"</p>
          
          <button
            onClick={() => navigate('/my-team')}
            className="go-to-team-btn"
          >
            МОЯ КОМАНДА
          </button>
        </div>
      </div>
    );
  };

  const renderCardsSection = () => {
    if (loading) {
      return <div className="loading">Загрузка заданий...</div>;
    }

    if (hasActiveTask) {
      return renderActiveTaskBlock();
    }

    return (
      <>
        <div className="cards-grid">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`card ${card.isOpen ? 'flipped' : ''} ${getRarityColor(card.rarity)} ${index === 1 ? 'middle-card' : ''}`}
              onClick={() => !card.isOpen && handleCardClick(index)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <div className="card-back-content">
                    <div className="card-back-title">НАЖМИТЕ ЧТОБЫ ОТКРЫТЬ</div>
                  </div>
                </div>
                <div className="card-back">
                  <div className="card-rarity">{getRarityName(card.rarity)}</div>
                  <div className="card-reward">
                    {card.rarity === 'troll' ? '-10 000 руб.' : `+${formatBalance(card.reward)}`}
                  </div>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-description">{card.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTakeTask(card);
                    }}
                    className="take-task-btn"
                  >
                    {card.rarity === 'troll' ? 'СДЕЛАТЬ ПАКОСТЬ' : 'ВЗЯТЬ ЗАДАНИЕ'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!hasActiveTask && cards.length > 0 && (
          <div className="replace-section">
            <button 
              onClick={handleReplaceCards}
              className="replace-btn"
              disabled={loading}
            >
              <span className="replace-text">Заменить карты*</span>
            </button>
            <div className="replace-cost">
              <span className="cost-text">*Стоимость каждой замены карт испытаний</span>
              <span className="cost-amount">-10 000 руб.</span>
            </div>
          </div>
        )}

        {showTeamSelect && (
          <div className="mischief-modal">
            <div className="mischief-content">
              <h3>ВЫБЕРИТЕ КОМАНДУ ДЛЯ ПАКОСТИ</h3>
              <p>Баланс выбранной команды уменьшится на 10 000 руб.</p>
              
              <div className="team-select">
                {teamsData.map(team => (
                  <label key={team.id} className="team-option">
                    <input
                      type="radio"
                      name="targetTeam"
                      value={team.name}
                      checked={selectedTeamForMischief === team.name}
                      onChange={(e) => setSelectedTeamForMischief(e.target.value)}
                    />
                    <span className="team-name">{team.name} ({team.balance})</span>
                  </label>
                ))}
              </div>
              
              <div className="mischief-actions">
                <button 
                  onClick={handleMischiefConfirm}
                  className="btn-confirm"
                  disabled={!selectedTeamForMischief}
                >
                  ПОДТВЕРДИТЬ ПАКОСТЬ
                </button>
                <button 
                  onClick={() => setShowTeamSelect(false)}
                  className="btn-cancel"
                >
                  ОТМЕНА
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="main-page">
      {error && <div className="error-message">{error}</div>}
      <div className="main-container">
        
        {/* Левая колонка - Карты и действия */}
        <div className="left-column">
          <div className="cards-actions-block">
            <div className="block-title">КАРТЫ И ДЕЙСТВИЯ</div>
            
            <div className="card-type">
              <div className="card-name">ЭПИЧЕСКОЕ БЕЗУМСТВО</div>
              <div className="card-reward">+50 000 руб.</div>
            </div>
            
            <div className="card-type">
              <div className="card-name">ПРОСТАЯ ШАЛОСТЬ</div>
              <div className="card-reward">+25 000 руб.</div>
            </div>
            
            <div className="card-type">
              <div className="card-name">ПАКОСТЬ ПРОТИВНИКУ</div>
              <div className="card-reward">-10 000 руб.</div>
            </div>
            
            <div className="card-type">
              <div className="card-name">ЗАМЕНА КАРТ</div>
              <div className="card-reward">-10 000 руб.</div>
            </div>
          </div>
        </div>

        {/* Центральная колонка - Карты заданий */}
        <div className="center-column">
          {renderCardsSection()}
        </div>

        {/* Правая колонка - Котлы команд */}
        <div className="right-column">
          <div className="rating-block">
            <div className="rating-title">КОТЛЫ КОМАНД</div>
            
            <div className="teams-list">
              {teamsData.map((team) => (
                <div key={team.id} className="team-row">
                  <div className="team-icon">
                    <svg width="29" height="38" viewBox="0 0 29 38" fill="none">
                      <path d="M0 26.0217L14.7101 38L29 26.0217V5.78261L25.8478 2.89131L17.8518 14.725H23.1685L8.42681 28.5L14.7101 14.725H8.91015L17.8518 0L7.14493 4.13358e-06L0 5.78261V26.0217Z" fill="#FF5000"/>
                    </svg>
                  </div>
                  <div className="team-name">{team.name}</div>
                  <div className="team-balance">{team.balance}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainPage;