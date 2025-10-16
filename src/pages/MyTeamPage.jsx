import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyTeamPage.css';

const MyTeamPage = () => {
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState({
    name: 'КОМАНДА RECRENT',
    balance: '200 000',
    place: '#2',
    completedTasks: '10',
    freeCancellations: '1/3'
  });

  const [currentTask, setCurrentTask] = useState({
    type: 'ЭПИЧЕСКОЕ БЕЗУМСТВО',
    reward: '+50 000 РУБ.',
    title: 'БЕЗУМНЫЙ ТАНКИСТ',
    description: 'Вывод должен провести бой на карте "Процедурам" зі таких адресів типа (магазину, також на містах лестниць на темблозі). Музею одержуть тайбуд.',
    status: 'В процессе'
  });

  const [leaderboard, setLeaderboard] = useState([
    { team: 'квитанкогг', completed: 10, balance: '200 000 руб.' },
    { team: 'кскект', completed: 8, balance: '140 000 руб.' },
    { team: 'знаспекк', completed: 6, balance: '60 000 руб.' },
    { team: 'цзка', completed: 4, balance: '20 000 руб.' }
  ]);

  const handleTaskComplete = () => {
    // Логика выполнения задания
    console.log('Задание выполнено');
  };

  const handleTaskCancel = () => {
    // Логика отмены задания
    console.log('Задание отменено');
  };

  return (
    <div className="my-team-page">
      <div className="my-team-container">
        
        {/* Заголовок */}
        <div className="team-header">
          <h1 className="team-title">{teamData.name}</h1>
          <div className="team-subtitle">ТЕКУЩЕЕ ЗАДАНИЕ:</div>
        </div>

        <div className="team-content">
          
          {/* Левая колонка - Текущее задание */}
          <div className="left-column">
            <div className="current-task-card">
              <div className="task-type">{currentTask.type}</div>
              <div className="task-reward">{currentTask.reward}</div>
              <div className="task-title">{currentTask.title}</div>
              <div className="task-description">{currentTask.description}</div>
              
              <div className="task-actions">
                <button className="btn-complete" onClick={handleTaskComplete}>
                  Задание выполнено
                </button>
                <button className="btn-cancel" onClick={handleTaskCancel}>
                  Отменить
                </button>
              </div>

              <div className="cancellation-info">
                <div className="free-cancels">
                  Бесплатных отмен осталось: <span>{teamData.freeCancellations}</span>
                </div>
                <div className="penalty-info">
                  Отмена последующих заданий: <span>-10 000 руб.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - Статистика и таблица */}
          <div className="right-column">
            
            {/* Блок баланса */}
            <div className="balance-card">
              <div className="balance-title">БАЛАНС КОМАНДЫ:</div>
              <div className="balance-amount">{teamData.balance} РУБ.</div>
            </div>

            {/* Блок статистики */}
            <div className="stats-card">
              <div className="stat-item">
                <div className="stat-label">МЕСТО В ТАБЛИЦЕ:</div>
                <div className="stat-value">{teamData.place}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Выполнено заданий:</div>
                <div className="stat-value">{teamData.completedTasks}</div>
              </div>
            </div>

            {/* Турнирная таблица */}
            <div className="leaderboard-card">
              <div className="leaderboard-title">ТУРНИРНАЯ ТАБЛИЦА:</div>
              <div className="leaderboard-header">
                <div className="header-team">Команда</div>
                <div className="header-completed">Выполнено</div>
                <div className="header-balance">Баланс</div>
              </div>
              <div className="leaderboard-list">
                {leaderboard.map((item, index) => (
                  <div key={index} className="leaderboard-item">
                    <div className="item-team">{item.team}</div>
                    <div className="item-completed">{item.completed}</div>
                    <div className="item-balance">{item.balance}</div>
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