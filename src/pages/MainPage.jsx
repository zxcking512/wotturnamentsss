import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import api from '../services/api';
import Card from '../components/Card/Card';
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
  
  // Для модалки пакости
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

  // Загрузка команд для пакости
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
      // Для пакости показываем модалку выбора команды
      setSelectedMischiefCard(card);
      await loadTeamsForMischief();
      setShowMischiefModal(true);
    } else {
      // Для обычных заданий сразу выбираем
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

  // Обработчик выполнения пакости
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
    if (hasActiveTask || loading) {
      alert('Нельзя заменять карточки при активном задании!');
      return;
    }

    try {
      const response = await api.replaceChallenges();
      if (response.success) {
        await loadAllData();
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
    }
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
    if (loading) {
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
            <Card
              key={card.id || index}
              challenge={card}
              onSelect={handleTakeTask}
              canSelect={!loading}
            />
          ))}
        </div>

        <div className="replace-section">
          <button 
            onClick={handleReplaceCards}
            className="replace-btn"
            disabled={loading || (myTeamData && myTeamData.team && myTeamData.team.balance < 10000)}
          >
            <span className="replace-text">Заменить карты*</span>
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
              <div className="action-reward">-10 000 руб.</div>
            </div>
          </div>
        </div>

        <div className="center-column">
          <div className="balance-display">
            Баланс: {myTeamData ? formatBalance(myTeamData.team.balance) : '0 руб.'}
          </div>
          {renderCardsSection()}
        </div>

        <div className="right-column">
          <div className="rating-block">
            <div className="block-title">КОТЛЫ КОМАНД</div>
            <div className="title-divider"></div>
            
            <div className="teams-list">
              {teams.length > 0 ? (
                teams.map((team, index) => (
                  <div key={team.id || team.name} className="action-item">
                    <div className="action-name">{team.name}</div>
                    <div className="action-reward">{formatBalance(team.balance)}</div>
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

      {/* Модалка для выбора команды пакости */}
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