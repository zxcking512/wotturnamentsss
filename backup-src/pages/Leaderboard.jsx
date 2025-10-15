import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const mockTeams = [
      {
        id: '1',
        name: 'Recrent',
        balance: 200000,
        completedTasks: 10,
        currentTask: 'Безумный танкист',
        status: 'выполняется'
      },
      {
        id: '2',
        name: 'Brainlabinoff',
        balance: 150000,
        completedTasks: 8,
        currentTask: 'Перевозка',
        status: 'ждёт модерации'
      },
      {
        id: '3',
        name: 'Shadowlake',
        balance: 100000,
        completedTasks: 6,
        status: 'нет задания'
      },
      {
        id: '4',
        name: 'LICENSE',
        balance: 30000,
        completedTasks: 4,
        currentTask: 'Оно живое!',
        status: 'выполняется'
      }
    ];
    setTeams(mockTeams);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'выполняется': return 'status-yellow';
      case 'ждёт модерации': return 'status-blue';
      case 'выполнено': return 'status-green';
      case 'не выполнено': return 'status-red';
      default: return 'status-gray';
    }
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('ru-RU').format(balance) + ' руб.';
  };

  const getPositionColor = (index) => {
    switch (index) {
      case 0: return 'position-gold';
      case 1: return 'position-silver';
      case 2: return 'position-bronze';
      default: return 'position-default';
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <div className="leaderboard-card">
          <h1 className="leaderboard-title">ТУРНИРНАЯ ТАБЛИЦА</h1>
          <p className="leaderboard-subtitle">Рейтинг команд по выполненным заданиям</p>

          <div className="table-container">
            <table className="teams-table">
              <thead>
                <tr>
                  <th className="th-place">Место</th>
                  <th className="th-team">Команда</th>
                  <th className="th-tasks">Выполнено заданий</th>
                  <th className="th-task">Текущее задание</th>
                  <th className="th-status">Статус</th>
                  <th className="th-balance">Баланс</th>
                </tr>
              </thead>
              <tbody>
                {teams
                  .sort((a, b) => b.balance - a.balance)
                  .map((team, index) => (
                    <tr key={team.id} className="table-row">
                      <td className="td-place">
                        <div className={`position-badge ${getPositionColor(index)}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="td-team">{team.name}</td>
                      <td className="td-tasks">{team.completedTasks}</td>
                      <td className="td-task">{team.currentTask || '—'}</td>
                      <td className={`td-status ${getStatusColor(team.status)}`}>
                        {team.status || '—'}
                      </td>
                      <td className="td-balance">{formatBalance(team.balance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-total">
              <h3>Всего команд</h3>
              <p>{teams.length}</p>
            </div>
            <div className="stat-card stat-completed">
              <h3>Всего заданий выполнено</h3>
              <p>{teams.reduce((sum, team) => sum + team.completedTasks, 0)}</p>
            </div>
            <div className="stat-card stat-balance">
              <h3>Общий баланс</h3>
              <p>{formatBalance(teams.reduce((sum, team) => sum + team.balance, 0))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;