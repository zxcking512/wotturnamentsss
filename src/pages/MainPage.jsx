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

    const newBalance = teamData.balance - 5000;
    if (newBalance < 0) {
      alert('Недостаточно средств для замены карточек!');
      return;
    }

    setTeamData(prev => ({ ...prev, balance: newBalance }));
    localStorage.setItem('balance', newBalance.toString());

    generateCards();
    setSelectedCard(null);
    setShowTeamSelect(false);
    
    alert('Карточки заменены! Спиcано 5 000 руб.');
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
          <div className="replace-section">
            <button 
              onClick={handleReplaceCards}
              className="replace-btn"
              disabled={teamData.balance < 5000}
            >
              <span className="replace-text">Заменить карты*</span>
            </button>
            <div className="replace-cost">
              <span className="cost-text">*Стоимость каждой замены карт испытаний</span>
              <span className="cost-amount">-5 000 руб.</span>
            </div>
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
              <div className="card-reward">-5 000 руб.</div>
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
              <div className="team-item">
                <div className="team-name">RECRENT</div>
                <div className="team-balance">200 000 руб.</div>
              </div>
              <div className="team-item">
                <div className="team-name">BRATISHKOFF</div>
                <div className="team-balance">150 000 руб.</div>
              </div>
              <div className="team-item">
                <div className="team-name">SHADOWKEKW</div>
                <div className="team-balance">100 000 руб.</div>
              </div>
              <div className="team-item">
                <div className="team-name">LEVSHA</div>
                <div className="team-balance">50 000 руб.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainPage;