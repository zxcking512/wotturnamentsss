import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import api from '../services/api';
import MischiefModal from '../components/MischiefModal/MischiefModal';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [hasActiveTask, setHasActiveTask] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mischiefModal, setMischiefModal] = useState({
    isOpen: false,
    challengeId: null
  });
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    console.log('MainPage mounted, loading challenges...');
    loadChallenges();
    loadTeams();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching available challenges...');
      
      const response = await api.getAvailableChallenges();
      console.log('Challenges response:', response);
      
      if (response.hasActiveChallenge) {
        console.log('Has active challenge:', response.activeChallenge);
        setHasActiveTask(true);
        setActiveTask(response.activeChallenge);
      } else {
        console.log('No active challenge, setting cards:', response.challenges);
        setHasActiveTask(false);
        setCards(response.challenges || []);
      }
    } catch (error) {
      console.error('Load challenges error:', error);
      setError('Ошибка загрузки заданий: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await api.getLeaderboard();
      // Сортируем команды по балансу (от большего к меньшему)
      const sortedTeams = response
        .sort((a, b) => b.balance - a.balance)
        .map(team => ({
          ...team,
          // Делаем первую букву заглавной, остальные строчными
          name: team.name.charAt(0).toUpperCase() + team.name.slice(1).toLowerCase()
        }));
      setTeams(sortedTeams);
    } catch (error) {
      console.error('Load teams error:', error);
      // Если API не работает, используем тестовые данные с правильным регистром
      setTeams([
        { name: 'Recrent', balance: 100000 },
        { name: 'Bratishkinoff', balance: 50000 },
        { name: 'Shadowkek', balance: 70000 },
        { name: 'Levsha', balance: 30000 }
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
      console.log('Selecting challenge:', card.id);
      const response = await api.selectChallenge(card.id);
      console.log('Select challenge response:', response);
      
      if (response.requiresTarget) {
        setMischiefModal({
          isOpen: true,
          challengeId: card.id
        });
      } else if (response.success) {
        setHasActiveTask(true);
        setSuccessMessage(`Задание "${card.title}" принято!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        navigate('/my-team');
      }
    } catch (error) {
      console.error('Take task error:', error);
      setError('Ошибка при выборе задания: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleMischiefSuccess = async (message, newBalance) => {
    setSuccessMessage(message);
    setMischiefModal({ isOpen: false, challengeId: null });
    await loadChallenges();
    await loadTeams(); // Обновляем балансы после пакости
    setTimeout(() => setSuccessMessage(''), 5000);
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
        await loadTeams(); // Обновляем балансы после замены карт
        setSuccessMessage('Карточки заменены! Спиcано 5 000 руб.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Replace cards error:', error);
      if (error.message?.includes('Недостаточно средств')) {
        setError('Недостаточно средств для замены карточек!');
      } else {
        setError('Ошибка при замене карточек: ' + (error.message || 'Неизвестная ошибка'));
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

    if (hasActiveTask) {
      return renderActiveTaskBlock();
    }

    if (cards.length === 0) {
      return (
        <div className="no-cards-message">
          <h3>Нет доступных заданий</h3>
          <p>Попробуйте обновить страницу или обратитесь к модератору</p>
          <button onClick={loadChallenges} className="retry-btn">
            Обновить
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="cards-grid">
          {cards.map((card, index) => (
            <div
              key={card.id || index}
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
            <span className="cost-amount">-5 000 руб.</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="main-page">
      {successMessage && <div className="successMessage">{successMessage}</div>}
      
      <div className="main-container">
        
        {/* Левая колонка - Карты и действия */}
        <div className="left-column">
          <div className="cards-actions-block">
            <div className="block-title">КАРТЫ И ДЕЙСТВИЯ</div>
            <div className="title-divider"></div>
            
            <div className="action-item">
              <div className="action-name">ЭПИЧЕСКОЕ БЕЗУМСТВО</div>
              <div className="action-reward">+50 000 руб.</div>
            </div>
            
            <div className="action-item">
              <div className="action-name">ПРОСТАЯ ШАЛОСТЬ</div>
              <div className="action-reward">+5 000 руб.</div>
            </div>
            
            <div className="action-item">
              <div className="action-name">ПАКОСТЬ ПРОТИВНИКУ</div>
              <div className="action-reward">-10 000 руб.</div>
            </div>
            
            <div className="action-item">
              <div className="action-name">ЗАМЕНА КАРТ</div>
              <div className="action-reward">-5 000 руб.</div>
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
            <div className="block-title">КОТЛЫ КОМАНД</div>
            <div className="title-divider"></div>
            
            <div className="teams-list">
              {teams.map((team, index) => (
                <div key={team.name} className="action-item">
                  <div className="action-name">{team.name}</div>
                  <div className="action-reward">{formatBalance(team.balance)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Модальное окно для пакости */}
      <MischiefModal
        isOpen={mischiefModal.isOpen}
        onClose={() => setMischiefModal({ isOpen: false, challengeId: null })}
        challengeId={mischiefModal.challengeId}
        onSuccess={handleMischiefSuccess}
      />
    </div>
  );
};

export default MainPage;