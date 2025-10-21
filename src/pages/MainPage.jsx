// MainPage.js
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
  
  const [showMischiefModal, setShowMischiefModal] = useState(false);
  const [selectedMischiefCard, setSelectedMischiefCard] = useState(null);
  const [mischiefTeams, setMischiefTeams] = useState([]);
  const [selectedTargetTeam, setSelectedTargetTeam] = useState('');

  useEffect(() => {
    console.log('MainPage mounted, loading challenges...');
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

  const loadTeamsForMischief = async () => {
    try {
      const teams = await api.getTeamsForMischief();
      setMischiefTeams(teams);
    } catch (error) {
      console.error('Error loading teams for mischief:', error);
    }
  };

  const handleTakeTask = async (card) => {
    if (!card || hasActiveTask || loading) return;

    if (card.rarity === 'troll') {
      setSelectedMischiefCard(card);
      await loadTeamsForMischief();
      setShowMischiefModal(true);
    } else {
      try {
        console.log('Selecting challenge:', card.id);
        const response = await api.selectChallenge(card.id);
        console.log('Select challenge response:', response);
        
        if (response.success) {
          setHasActiveTask(true);
          setSuccessMessage(`Задание "${card.title}" принято!`);
          setTimeout(() => setSuccessMessage(''), 3000);
          await loadAllData();
          navigate('/my-team');
        }
      } catch (error) {
        console.error('Take task error:', error);
        setError('Ошибка при выборе задания: ' + (error.message || 'Неизвестная ошибка'));
      }
    }
  };

  const handleMischiefConfirm = async () => {
    if (!selectedMischiefCard || !selectedTargetTeam) {
      alert('Выберите команду для пакости!');
      return;
    }

    try {
      setLoading(true);
      console.log('Performing mischief:', selectedMischiefCard.id, selectedTargetTeam);
      
      const response = await api.selectMischiefTarget(selectedMischiefCard.id, parseInt(selectedTargetTeam));
      console.log('Mischief response:', response);
      
      if (response.success) {
        setSuccessMessage(response.message || 'Пакость успешно выполнена!');
        setTimeout(() => setSuccessMessage(''), 5000);
        setShowMischiefModal(false);
        setSelectedMischiefCard(null);
        setSelectedTargetTeam('');
        await loadAllData();
      }
    } catch (error) {
      console.error('Mischief error:', error);
      setError('Ошибка выполнения пакости: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceCards = async () => {
    if (hasActiveTask || loading || replacingCards) {
      alert('Нельзя заменять карточки при активном задании!');
      return;
    }

    try {
      setReplacingCards(true);
      setLoading(true);
      
      setCards(prevCards => 
        prevCards.map(card => ({ ...card, isReplacing: true }))
      );
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await api.replaceChallenges();
      console.log('Replace cards response:', response);
      
      if (response.success) {
        await loadChallenges();
        setSuccessMessage('Карточки заменены! Спиcано 10 000 руб.');
        setTimeout(() => setSuccessMessage(''), 3000);
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
    console.log(`Card ${uniqueKey} replace animation complete`);
    setCards(prevCards => prevCards.filter(card => card.uniqueKey !== uniqueKey));
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
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

    if (hasActiveTask) {
      return renderActiveTaskBlock();
    }

    if (cards.length === 0 && !replacingCards) {
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
          {cards.map((card) => (
            <AnimatedCard
              key={card.uniqueKey}
              challenge={card}
              onSelect={handleTakeTask}
              canSelect={!loading && !replacingCards}
              isReplacing={card.isReplacing}
              onReplaceComplete={() => handleCardReplaceComplete(card.uniqueKey)}
            />
          ))}
        </div>

        <div className="replace-section">
          <button 
            onClick={handleReplaceCards}
            className="replace-btn"
            disabled={loading || replacingCards || (myTeamData && myTeamData.team && myTeamData.team.balance < 10000)}
          >
            <span className="replace-text">
              {replacingCards ? 'ЗАМЕНА...' : 'ЗАМЕНИТЬ КАРТЫ*'}
            </span>
          </button>
          <div className="replace-cost">
            <span className="cost-text">*Стоимость каждой замены карт испытаний</span>
            <span className="cost-amount">-10 000 руб.</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="main-page">
      {successMessage && <div className="successMessage">{successMessage}</div>}
      
      <div className="main-container">
        
        {/* ЛЕВЫЙ БЛОК - С ИКОНКАМИ */}
        <div className="left-column">
  <div className="cards-actions-block">
    <div className="cards-actions-title">КАРТЫ И ДЕЙСТВИЯ</div>
    <div className="cards-actions-divider"></div>
    
    <div className="cards-actions-list">
      <div className="action-item">
        <div className="action-icon-container">
          <img src="/images/icons/icon-1.svg" alt="Эпическое безумство" className="action-icon" />
        </div>
        <div className="action-text">
          <div className="action-name">ЭПИЧЕСКОЕ БЕЗУМСТВО</div>
          <div className="action-reward">+50 000 руб.</div>
        </div>
      </div>
      
      <div className="action-item">
        <div className="action-icon-container">
          <img src="/images/icons/icon-2.svg" alt="Простая шалость" className="action-icon" />
        </div>
        <div className="action-text">
          <div className="action-name">ПРОСТАЯ ШАЛОСТЬ</div>
          <div className="action-reward">+25 000 руб.</div>
        </div>
      </div>
      
      <div className="action-item">
        <div className="action-icon-container">
          <img src="/images/icons/icon-3.svg" alt="Пакость противнику" className="action-icon" />
        </div>
        <div className="action-text">
          <div className="action-name">ПАКОСТЬ ПРОТИВНИКУ</div>
          <div className="action-reward">-10 000 руб.</div>
        </div>
      </div>
      
      <div className="action-item">
        <div className="action-icon-container">
          <img src="/images/icons/icon-4.svg" alt="Замена карт" className="action-icon" />
        </div>
        <div className="action-text">
          <div className="action-name">ЗАМЕНА КАРТ</div>
          <div className="action-reward">-10 000 руб.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА С КАРТОЧКАМИ */}
        <div className="center-column">
          {renderCardsSection()}
        </div>

        {/* ПРАВЫЙ БЛОК С ИКОНКАМИ */}
        <div className="right-column">
  <div className="teams-rating-block">
    <div className="teams-rating-title">КОТЛЫ КОМАНД</div>
    <div className="teams-rating-divider"></div>
    
    <div className="teams-rating-list">
      {teams.length > 0 ? (
        teams.map((team, index) => (
          <div key={team.id || team.name} className="teams-rating-item">
            <div className="teams-rating-icon-container">
              <img src="/images/icons/icon-52.svg" alt="Команда" className="teams-rating-icon" />
            </div>
            <div className="teams-rating-name">{team.name}</div>
            <div className="teams-rating-balance">{formatBalance(team.balance)}</div>
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

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ ПАКОСТИ */}
      {showMischiefModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Выберите команду для пакости</h3>
            <select 
              value={selectedTargetTeam} 
              onChange={(e) => setSelectedTargetTeam(e.target.value)}
              className="mischief-select"
            >
              <option value="">Выберите команду</option>
              {mischiefTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.balance?.toLocaleString('ru-RU')} руб.)
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowMischiefModal(false)}>Отмена</button>
              <button 
                onClick={handleMischiefConfirm}
                disabled={!selectedTargetTeam || loading}
                className="mischief-btn"
              >
                {loading ? 'Выполняется...' : 'СДЕЛАТЬ ПАКОСТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;