import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyTeamPage.css';

const MyTeamPage = () => {
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState({
    name: '',
    balance: 0,
    completedTasks: 0,
    position: 0,
    freeCancellations: 3
  });
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = () => {
    const teamName = localStorage.getItem('teamName') || 'Команда';
    const balance = parseInt(localStorage.getItem('balance')) || 0;
    const completedTasks = parseInt(localStorage.getItem('completedTasks')) || 0;
    const freeCancellations = parseInt(localStorage.getItem('freeCancellations')) || 3;

    setTeamData({
      name: teamName,
      balance: balance,
      completedTasks: completedTasks,
      position: 1,
      freeCancellations: freeCancellations
    });

    const activeTask = localStorage.getItem('activeTask');
    if (activeTask) {
      setCurrentTask(JSON.parse(activeTask));
    }

    setLoading(false);
  };

  const handleTaskComplete = () => {
    if (!currentTask) return;

    const updatedTask = {
      ...currentTask,
      status: 'waiting_moderation'
    };
    
    setCurrentTask(updatedTask);
    localStorage.setItem('activeTask', JSON.stringify(updatedTask));
    
    alert('Задание отправлено на проверку модератору!');
  };

  const handleTaskCancel = () => {
    if (!currentTask) return;

    const cancellationsLeft = teamData.freeCancellations;
    let penalty = 0;

    if (cancellationsLeft > 0) {
      setTeamData(prev => ({
        ...prev,
        freeCancellations: prev.freeCancellations - 1
      }));
      localStorage.setItem('freeCancellations', (cancellationsLeft - 1).toString());
    } else {
      penalty = Math.floor(currentTask.reward * 0.2);
      const newBalance = teamData.balance - penalty;
      
      setTeamData(prev => ({
        ...prev,
        balance: newBalance
      }));
      localStorage.setItem('balance', newBalance.toString());
    }

    setCurrentTask(null);
    localStorage.removeItem('activeTask');

    alert(
      cancellationsLeft > 0 
        ? `Задание отменено. Осталось бесплатных отмен: ${cancellationsLeft - 1}`
        : `Задание отменено. Начислен штраф: -${penalty} руб.`
    );
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Эпическое безумство': return 'rarity-epic';
      case 'Дерзкий вызов': return 'rarity-rare';
      case 'Простая шалость': return 'rarity-common';
      default: return 'rarity-common';
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка данных команды...</p>
      </div>
    );
  }

  return (
    <div className="my-team-page">
      <div className="my-team-container">
        <div className="my-team-header">
          <h1 className="page-title">МОЯ КОМАНДА</h1>
          <p className="page-subtitle">Управление вашими заданиями и статистика</p>
        </div>

        <div className="team-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>БАЛАНС</h3>
              <p className="stat-value">{formatBalance(teamData.balance)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>МЕСТО В ТАБЛИЦЕ</h3>
              <p className="stat-value">#{teamData.position}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>ВЫПОЛНЕНО ЗАДАНИЙ</h3>
              <p className="stat-value">{teamData.completedTasks}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <h3>БЕСПЛАТНЫЕ ОТМЕНЫ</h3>
              <p className="stat-value">{teamData.freeCancellations}/3</p>
            </div>
          </div>
        </div>

        <div className="current-task-section">
          <h2 className="section-title">
            ТЕКУЩЕЕ ЗАДАНИЕ
            {currentTask && (
              <span className={`task-rarity-badge ${getRarityColor(currentTask.rarity)}`}>
                {currentTask.rarity}
              </span>
            )}
          </h2>

          {currentTask ? (
            <div className="active-task-card">
              <div className="task-reward">+{formatBalance(currentTask.reward)}</div>
              <h3 className="task-title">{currentTask.title}</h3>
              <p className="task-description">{currentTask.description}</p>
              
              <div className="task-status">
                Статус: <span className={`status-${currentTask.status}`}>
                  {currentTask.status === 'in_progress' && 'В процессе'}
                  {currentTask.status === 'waiting_moderation' && 'На модерации'}
                </span>
              </div>

              <div className="task-actions">
                <button
                  onClick={handleTaskComplete}
                  className="btn-complete"
                  disabled={currentTask.status === 'waiting_moderation'}
                >
                  {currentTask.status === 'waiting_moderation' ? 'ОЖИДАЕТ ПРОВЕРКИ' : 'ЗАДАНИЕ ВЫПОЛНЕНО'}
                </button>
                
                <button
                  onClick={handleTaskCancel}
                  className="btn-cancel"
                >
                  ОТМЕНИТЬ ЗАДАНИЕ
                </button>
              </div>

              {currentTask.status === 'waiting_moderation' && (
                <div className="moderation-notice">
                  ⏳ Задание проверяется модератором. Ожидайте решения.
                </div>
              )}

              <div className="cancellation-info">
                {teamData.freeCancellations > 0 ? (
                  <p>Бесплатных отмен осталось: <strong>{teamData.freeCancellations}</strong></p>
                ) : (
                  <p>Следующая отмена: <strong>-20% от награды</strong></p>
                )}
              </div>
            </div>
          ) : (
            <div className="no-task-card">
              <div className="no-task-icon">🎯</div>
              <h3>Нет активных заданий</h3>
              <p>Возьмите задание на главной странице чтобы начать зарабатывать!</p>
              <button
                onClick={() => navigate('/tasks')}
                className="btn-take-task"
              >
                ВЗЯТЬ ЗАДАНИЕ
              </button>
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2 className="section-title">БЫСТРЫЕ ДЕЙСТВИЯ</h2>
          <div className="action-buttons">
            <button
              onClick={() => navigate('/tasks')}
              className="action-btn primary"
            >
              📋 Взять новое задание
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="action-btn secondary"
            >
              📊 Посмотреть таблицу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamPage;