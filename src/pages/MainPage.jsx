import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [teamData, setTeamData] = useState({
    balance: 0,
    completedTasks: 0
  });
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [selectedTeamForMischief, setSelectedTeamForMischief] = useState('');
  const [hasActiveTask, setHasActiveTask] = useState(false);
  const [activeTaskStatus, setActiveTaskStatus] = useState('');

  const allTasks = [
    {
      id: 1,
      title: 'БЕЗУМНЫЙ ТАНКИСТ',
      description: 'Взвод должен провести бой на карте "Проворная" на танках одного типа. Нужно одержать победу.',
      rarity: 'Эпическое безумство',
      reward: 50000,
      type: 'task'
    },
    {
      id: 2,
      title: 'ПЕРЕВОЗКА',
      description: 'Взвод должен провести бой на карте "Проворная" на тяжёлых танках.',
      rarity: 'Эпическое безумство',
      reward: 50000,
      type: 'task'
    },
    {
      id: 3,
      title: 'ПОСЛЕДНИЙ ШАНС',
      description: 'Взвод должен провести бой, в котором все участники должны использовать только последний доступный снаряд.',
      rarity: 'Дерзкий вызов',
      reward: 25000,
      type: 'task'
    },
    {
      id: 4,
      title: 'СНАЙПЕР',
      description: 'Команда должна провести бой, в котором каждый участник должен сделать не менее 5 точных выстрелов.',
      rarity: 'Дерзкий вызов',
      reward: 25000,
      type: 'task'
    },
    {
      id: 5,
      title: 'ОНО ЖИВОЕ!',
      description: 'Команда должна провести 3 боя, в котором каждый участник команды должен остаться в живых.',
      rarity: 'Простая шалость',
      reward: 5000,
      type: 'task'
    },
    {
      id: 6,
      title: 'ТАНКОВЫЙ ЗАЕЗД',
      description: 'Взвод должен провести 5 боёв на лёгких танках.',
      rarity: 'Простая шалость',
      reward: 5000,
      type: 'task'
    },
    {
      id: 7,
      title: 'ШТУРМ',
      description: 'Взвод должен провести бой на карте "Уайтшип-Роуд" на средних танках.',
      rarity: 'Простая шалость',
      reward: 5000,
      type: 'task'
    },
    {
      id: 8,
      title: 'ОБОРОНА',
      description: 'Команда должна провести бой, в котором каждый участник должен заблокировать не менее 1000 урона.',
      rarity: 'Дерзкий вызов',
      reward: 25000,
      type: 'task'
    },
    {
      id: 9,
      title: 'ПАКОСТЬ',
      description: 'Выберите команду, у которой будет списано 10 000 рублей.',
      rarity: 'Пакость',
      reward: -10000,
      type: 'mischief'
    }
  ];

  useEffect(() => {
    loadTeamData();
    checkActiveTask();
    initializeBacklog();
  }, []);

  const loadTeamData = () => {
    const balance = parseInt(localStorage.getItem('balance')) || 200000;
    const completedTasks = parseInt(localStorage.getItem('completedTasks')) || 10;
    
    setTeamData({
      balance: balance,
      completedTasks: completedTasks
    });
  };

  const checkActiveTask = () => {
    const activeTask = localStorage.getItem('activeTask');
    if (activeTask) {
      const taskData = JSON.parse(activeTask);
      setHasActiveTask(true);
      setActiveTaskStatus(taskData.status);
    } else {
      setHasActiveTask(false);
      setActiveTaskStatus('');
      generateCards();
    }
  };

  const initializeBacklog = () => {
    if (!localStorage.getItem('taskBacklog')) {
      const initialBacklog = allTasks.filter(task => task.type !== 'mischief').map(task => task.id);
      localStorage.setItem('taskBacklog', JSON.stringify(initialBacklog));
    }
  };

  const getCurrentBacklog = () => {
    const backlog = localStorage.getItem('taskBacklog');
    return backlog ? JSON.parse(backlog) : [];
  };

  const updateBacklog = (usedTaskIds) => {
    let currentBacklog = getCurrentBacklog();
    currentBacklog = currentBacklog.filter(id => !usedTaskIds.includes(id));
    
    if (currentBacklog.length <= 3) {
      currentBacklog = allTasks.filter(task => task.type !== 'mischief').map(task => task.id);
    }
    
    localStorage.setItem('taskBacklog', JSON.stringify(currentBacklog));
    return currentBacklog;
  };

  const getRandomTasks = () => {
    const currentBacklog = getCurrentBacklog();
    const availableTasks = allTasks.filter(task => 
      currentBacklog.includes(task.id) || task.type === 'mischief'
    );
    
    const selectedTasks = [];
    const usedTaskIds = [];
    
    let hasEpic = false;
    let hasMischief = false;
    
    for (let i = 0; i < 3; i++) {
      if (availableTasks.length === 0) break;
      
      const filteredTasks = availableTasks.filter(task => {
        if (task.rarity === 'Эпическое безумство' && hasEpic) return false;
        if (task.type === 'mischief' && hasMischief) return false;
        return true;
      });

      if (filteredTasks.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * filteredTasks.length);
      const selectedTask = filteredTasks[randomIndex];
      
      if (selectedTask.rarity === 'Эпическое безумство') hasEpic = true;
      if (selectedTask.type === 'mischief') hasMischief = true;
      
      selectedTasks.push({
        ...selectedTask,
        isOpen: false
      });

      if (selectedTask.type !== 'mischief') {
        usedTaskIds.push(selectedTask.id);
      }
      
      const originalIndex = availableTasks.findIndex(t => t.id === selectedTask.id);
      if (originalIndex !== -1) {
        availableTasks.splice(originalIndex, 1);
      }
    }
    
    if (usedTaskIds.length > 0) {
      updateBacklog(usedTaskIds);
    }
    
    return selectedTasks;
  };

  const generateCards = () => {
    const newCards = getRandomTasks();
    setCards(newCards);
  };

  const handleCardClick = (cardIndex) => {
    if (hasActiveTask) return;
    
    const updatedCards = [...cards];
    updatedCards[cardIndex].isOpen = true;
    setCards(updatedCards);
    setSelectedCard(updatedCards[cardIndex]);
  };

  const handleTakeTask = (card) => {
    if (!card || hasActiveTask) return;

    if (card.type === 'mischief') {
      setShowTeamSelect(true);
      return;
    }

    const activeTask = {
      ...card,
      status: 'in_progress',
      takenAt: new Date().toISOString()
    };

    localStorage.setItem('activeTask', JSON.stringify(activeTask));
    setHasActiveTask(true);
    setActiveTaskStatus('in_progress');
    
    alert(`Задание "${card.title}" принято!`);
    navigate('/my-team');
  };

  const handleMischiefConfirm = () => {
    if (!selectedTeamForMischief) {
      alert('Выберите команду для пакости!');
      return;
    }

    const currentTeamName = localStorage.getItem('currentTeam') || 'RECRENT';
    
    if (selectedTeamForMischief === currentTeamName) {
      const newBalance = teamData.balance - 10000;
      setTeamData(prev => ({ ...prev, balance: newBalance }));
      localStorage.setItem('balance', newBalance.toString());
    }

    alert(`Пакость совершена! Команда ${selectedTeamForMischief} теряет 10 000 руб.`);
    
    setShowTeamSelect(false);
    setSelectedTeamForMischief('');
    setSelectedCard(null);
    generateCards();
  };

  const handleReplaceCards = () => {
    if (hasActiveTask) {
      alert('Нельзя заменять карточки при активном задании!');
      return;
    }

    const newBalance = teamData.balance - 10000;
    if (newBalance < 0) {
      alert('Недостаточно средств для замены карточек!');
      return;
    }

    setTeamData(prev => ({ ...prev, balance: newBalance }));
    localStorage.setItem('balance', newBalance.toString());

    generateCards();
    setSelectedCard(null);
    setShowTeamSelect(false);
    
    alert('Карточки заменены! Спиcано 10 000 руб.');
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Эпическое безумство': return 'epic';
      case 'Дерзкий вызов': return 'rare';
      case 'Простая шалость': return 'common';
      case 'Пакость': return 'mischief';
      default: return 'common';
    }
  };

  const renderActiveTaskBlock = () => {
    return (
      <div className="active-task-notification">
        <div className="notification-content">
          <h2>ЗАДАНИЕ ПРИНЯТО!</h2>
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
    if (hasActiveTask) {
      return renderActiveTaskBlock();
    }

    return (
      <>
        <div className="cards-grid">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`card ${card.isOpen ? 'flipped' : ''} ${getRarityColor(card.rarity)}`}
              onClick={() => !card.isOpen && handleCardClick(index)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <div className="card-back-content">
                    <div className="card-back-title">НАЖМИТЕ ЧТОБЫ ОТКРЫТЬ</div>
                  </div>
                </div>
                <div className="card-back">
                  <div className="card-rarity">{card.rarity}</div>
                  <div className="card-reward">
                    {card.type === 'mischief' ? '-10 000 руб.' : `+${formatBalance(card.reward)}`}
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
                    {card.type === 'mischief' ? 'СДЕЛАТЬ ПАКОСТЬ' : 'ВЗЯТЬ ЗАДАНИЕ'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!hasActiveTask && (
          <div className="replace-cards-center">
            <button 
              onClick={handleReplaceCards}
              className="replace-cards-btn"
              disabled={teamData.balance < 10000}
            >
              ЗАМЕНИТЬ КАРТОЧКИ
            </button>
            <p className="replace-cost-center">
              *Стоимость каждой замены карт испытаний: 10 000 руб.
            </p>
          </div>
        )}

        {showTeamSelect && (
          <div className="mischief-modal">
            <div className="mischief-content">
              <h3>ВЫБЕРИТЕ КОМАНДУ ДЛЯ ПАКОСТИ</h3>
              <p>Баланс выбранной команды уменьшится на 10 000 руб.</p>
              
              <div className="team-select">
                {['RECRENT', 'BRATISHKINOFF', 'SHADOWKEK', 'LEVSHA'].map(team => (
                  <label key={team} className="team-option">
                    <input
                      type="radio"
                      name="targetTeam"
                      value={team}
                      checked={selectedTeamForMischief === team}
                      onChange={(e) => setSelectedTeamForMischief(e.target.value)}
                    />
                    <span className="team-name">{team}</span>
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
      {/* Header УДАЛЕН - он теперь в App.jsx */}
      
      <div className="main-container">
        <div className="content-wrapper">
          <div className="left-sidebar">
            <div className="balance-section">
              <h1>БАЛАНС КОМАНДЫ: {formatBalance(teamData.balance)}</h1>
            </div>
            
            <div className="card-types">
              <h3>ВИДЫ КАРТ:</h3>
              <div className="card-type-item">
                <span className="type-name">Эпическое безумство</span>
                <span className="type-reward">+50 000 руб.</span>
              </div>
              <div className="card-type-item">
                <span className="type-name">Дерзкий вызов</span>
                <span className="type-reward">+25 000 руб.</span>
              </div>
              <div className="card-type-item">
                <span className="type-name">Простая шалость</span>
                <span className="type-reward">+5 000 руб.</span>
              </div>
              <div className="card-type-item">
                <span className="type-name">Пакость (другой команде)</span>
                <span className="type-reward">-10 000 руб.</span>
              </div>
            </div>
          </div>

          <div className="center-content">
            {renderCardsSection()}
          </div>

          <div className="right-sidebar">
            <div className="tournament-table">
              <h3>ТУРНИРНАЯ ТАБЛИЦА:</h3>
              <div className="team-rank">
                <span className="team-name">RECRENT</span>
                <span className="team-balance">200 000 руб.</span>
              </div>
              <div className="team-rank">
                <span className="team-name">BRATISHKINOFF</span>
                <span className="team-balance">150 000 руб.</span>
              </div>
              <div className="team-rank">
                <span className="team-name">SHADOWKEK</span>
                <span className="team-balance">100 000 руб.</span>
              </div>
              <div className="team-rank">
                <span className="team-name">LEVSHA</span>
                <span className="team-balance">30 000 руб.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;