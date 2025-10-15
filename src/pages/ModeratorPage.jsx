import React, { useState, useEffect } from 'react';
import './ModeratorPage.css';

const ModeratorPage = () => {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    rarity: 'Простая шалость',
    reward: 5000
  });
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Данные по вероятностям выпадения
  const [probabilities, setProbabilities] = useState({
    epic: 20,
    rare: 30,
    common: 45,
    mischief: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Тестовые данные команд
    const mockTeams = [
      {
        id: 1,
        name: 'RECRENT',
        balance: 200000,
        completedTasks: 10,
        currentTask: 'Безумный танкист',
        taskStatus: 'waiting_moderation',
        taskReward: 50000
      },
      {
        id: 2,
        name: 'BRATISHKINOFF',
        balance: 150000,
        completedTasks: 8,
        currentTask: 'Перевозка',
        taskStatus: 'in_progress',
        taskReward: 50000
      },
      {
        id: 3,
        name: 'SHADOWKEK',
        balance: 100000,
        completedTasks: 6,
        currentTask: '',
        taskStatus: 'none',
        taskReward: 0
      },
      {
        id: 4,
        name: 'LEVSHA',
        balance: 30000,
        completedTasks: 4,
        currentTask: 'Оно живое!',
        taskStatus: 'waiting_moderation',
        taskReward: 5000
      }
    ];

    // Тестовые задания
    const mockTasks = [
      {
        id: 1,
        title: 'Безумный танкист',
        description: 'Взвод должен провести бой на карте "Проворная" на танках одного типа. Нужно одержать победу.',
        rarity: 'Эпическое безумство',
        reward: 50000,
        isActive: true
      },
      {
        id: 2,
        title: 'Перевозка',
        description: 'Взвод должен провести бой на карте "Проворная" на тяжёлых танках.',
        rarity: 'Эпическое безумство',
        reward: 50000,
        isActive: true
      },
      {
        id: 3,
        title: 'Последний шанс',
        description: 'Взвод должен провести бой, в котором все участники должны использовать только последний доступный снаряд.',
        rarity: 'Дерзкий вызов',
        reward: 25000,
        isActive: true
      },
      {
        id: 4,
        title: 'Оно живое!',
        description: 'Команда должна провести 3 боя, в котором каждый участник команды должен остаться в живых.',
        rarity: 'Простая шалость',
        reward: 5000,
        isActive: true
      }
    ];

    setTeams(mockTeams);
    setTasks(mockTasks);
  };

  const handleStatusChange = (teamId, newStatus) => {
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        if (newStatus === 'completed' && team.taskStatus === 'waiting_moderation') {
          // Начисляем награду за выполнение
          return {
            ...team,
            balance: team.balance + team.taskReward,
            completedTasks: team.completedTasks + 1,
            currentTask: '',
            taskStatus: 'none',
            taskReward: 0
          };
        } else if (newStatus === 'failed') {
          // Не начисляем награду
          return {
            ...team,
            currentTask: '',
            taskStatus: 'none',
            taskReward: 0
          };
        } else {
          return {
            ...team,
            taskStatus: newStatus
          };
        }
      }
      return team;
    });

    setTeams(updatedTeams);
  };

  const startEditing = (team) => {
    setEditingTeam(team.id);
    setEditingValues({
      balance: team.balance,
      completedTasks: team.completedTasks
    });
  };

  const saveEditing = (teamId) => {
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          balance: parseInt(editingValues.balance) || team.balance,
          completedTasks: parseInt(editingValues.completedTasks) || team.completedTasks
        };
      }
      return team;
    });

    setTeams(updatedTeams);
    setEditingTeam(null);
    setEditingValues({});
  };

  const cancelEditing = () => {
    setEditingTeam(null);
    setEditingValues({});
  };

  const handleProbabilityChange = (type, value) => {
    const newValue = parseInt(value) || 0;
    setProbabilities(prev => ({
      ...prev,
      [type]: newValue
    }));
  };

  const saveProbabilities = () => {
    const total = Object.values(probabilities).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      alert(`Сумма вероятностей должна быть 100%. Текущая сумма: ${total}%`);
      return;
    }
    alert('Вероятности сохранены!');
  };

  const resetTasks = () => {
    if (window.confirm('Вы уверены что хотите сбросить историю заданий для всех команд?')) {
      alert('История заданий сброшена!');
      // В реальном приложении здесь был бы API вызов
    }
  };

  const handleNewTaskChange = (field, value) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addNewTask = () => {
    if (!newTask.title || !newTask.description) {
      alert('Заполните название и описание задания!');
      return;
    }

    const task = {
      id: tasks.length + 1,
      ...newTask,
      reward: parseInt(newTask.reward) || 5000,
      isActive: true
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      rarity: 'Простая шалость',
      reward: 5000
    });
    setShowTaskForm(false);
    alert('Задание добавлено!');
  };

  const toggleTaskActive = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, isActive: !task.isActive } : task
    ));
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_progress': return 'В процессе';
      case 'waiting_moderation': return 'Ждёт модерации';
      case 'completed': return 'Выполнено';
      case 'failed': return 'Не выполнено';
      default: return 'Нет задания';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'status-in-progress';
      case 'waiting_moderation': return 'status-moderation';
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      default: return 'status-none';
    }
  };

  return (
    <div className="moderator-page">
      <div className="moderator-container">
        <h1 className="page-title">ПАНЕЛЬ МОДЕРАТОРА</h1>

        {/* Раздел управления командами */}
        <div className="section">
          <h2 className="section-title">Управление командами</h2>
          <div className="table-container">
            <table className="teams-table">
              <thead>
                <tr>
                  <th>Команда</th>
                  <th>Баланс</th>
                  <th>Выполнено заданий</th>
                  <th>Текущее задание</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id}>
                    <td className="team-name">{team.name}</td>
                    <td>
                      {editingTeam === team.id ? (
                        <input
                          type="number"
                          value={editingValues.balance || ''}
                          onChange={(e) => setEditingValues(prev => ({
                            ...prev,
                            balance: e.target.value
                          }))}
                          className="edit-input"
                        />
                      ) : (
                        formatBalance(team.balance)
                      )}
                    </td>
                    <td>
                      {editingTeam === team.id ? (
                        <input
                          type="number"
                          value={editingValues.completedTasks || ''}
                          onChange={(e) => setEditingValues(prev => ({
                            ...prev,
                            completedTasks: e.target.value
                          }))}
                          className="edit-input"
                        />
                      ) : (
                        team.completedTasks
                      )}
                    </td>
                    <td>{team.currentTask || '—'}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(team.taskStatus)}`}>
                        {getStatusText(team.taskStatus)}
                      </span>
                    </td>
                    <td className="actions">
                      {editingTeam === team.id ? (
                        <div className="edit-actions">
                          <button 
                            onClick={() => saveEditing(team.id)}
                            className="btn-save"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="btn-cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button 
                            onClick={() => startEditing(team)}
                            className="btn-edit"
                          >
                            ✎
                          </button>
                          {team.taskStatus === 'waiting_moderation' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(team.id, 'completed')}
                                className="btn-success"
                              >
                                ✓ Выполнено
                              </button>
                              <button 
                                onClick={() => handleStatusChange(team.id, 'failed')}
                                className="btn-danger"
                              >
                                ✕ Провалено
                              </button>
                            </>
                          )}
                          {team.taskStatus === 'in_progress' && (
                            <button 
                              onClick={() => handleStatusChange(team.id, 'waiting_moderation')}
                              className="btn-warning"
                            >
                              На модерацию
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Раздел управления заданиями */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Управление заданиями</h2>
            <button 
              onClick={() => setShowTaskForm(true)}
              className="btn-primary"
            >
              + Новое задание
            </button>
          </div>

          {showTaskForm && (
            <div className="task-form">
              <h3>Добавить новое задание</h3>
              <div className="form-group">
                <label>Название задания:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => handleNewTaskChange('title', e.target.value)}
                  placeholder="Введите название задания"
                />
              </div>
              <div className="form-group">
                <label>Описание:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => handleNewTaskChange('description', e.target.value)}
                  placeholder="Введите описание задания"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Редкость:</label>
                <select
                  value={newTask.rarity}
                  onChange={(e) => handleNewTaskChange('rarity', e.target.value)}
                >
                  <option value="Простая шалость">Простая шалость</option>
                  <option value="Дерзкий вызов">Дерзкий вызов</option>
                  <option value="Эпическое безумство">Эпическое безумство</option>
                </select>
              </div>
              <div className="form-group">
                <label>Награда (руб.):</label>
                <input
                  type="number"
                  value={newTask.reward}
                  onChange={(e) => handleNewTaskChange('reward', e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button onClick={addNewTask} className="btn-success">
                  Добавить задание
                </button>
                <button onClick={() => setShowTaskForm(false)} className="btn-cancel">
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.id} className={`task-card ${task.isActive ? 'active' : 'inactive'}`}>
                <div className="task-header">
                  <h4>{task.title}</h4>
                  <span className={`rarity-badge rarity-${task.rarity.replace(' ', '-').toLowerCase()}`}>
                    {task.rarity}
                  </span>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-footer">
                  <span className="task-reward">+{formatBalance(task.reward)}</span>
                  <button 
                    onClick={() => toggleTaskActive(task.id)}
                    className={`btn-toggle ${task.isActive ? 'active' : 'inactive'}`}
                  >
                    {task.isActive ? 'Деактивировать' : 'Активировать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Раздел вероятностей выпадения */}
        <div className="section">
          <h2 className="section-title">Вероятности выпадения заданий</h2>
          <div className="probabilities-grid">
            <div className="probability-item">
              <label>Эпическое безумство:</label>
              <input
                type="number"
                value={probabilities.epic}
                onChange={(e) => handleProbabilityChange('epic', e.target.value)}
                min="0"
                max="100"
              />
              <span>%</span>
            </div>
            <div className="probability-item">
              <label>Дерзкий вызов:</label>
              <input
                type="number"
                value={probabilities.rare}
                onChange={(e) => handleProbabilityChange('rare', e.target.value)}
                min="0"
                max="100"
              />
              <span>%</span>
            </div>
            <div className="probability-item">
              <label>Простая шалость:</label>
              <input
                type="number"
                value={probabilities.common}
                onChange={(e) => handleProbabilityChange('common', e.target.value)}
                min="0"
                max="100"
              />
              <span>%</span>
            </div>
            <div className="probability-item">
              <label>Пакость:</label>
              <input
                type="number"
                value={probabilities.mischief}
                onChange={(e) => handleProbabilityChange('mischief', e.target.value)}
                min="0"
                max="100"
              />
              <span>%</span>
            </div>
          </div>
          <div className="probability-total">
            Общая сумма: {Object.values(probabilities).reduce((sum, val) => sum + val, 0)}%
          </div>
          <div className="probability-actions">
            <button onClick={saveProbabilities} className="btn-primary">
              Сохранить вероятности
            </button>
            <button onClick={resetTasks} className="btn-warning">
              Сбросить историю заданий
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorPage;