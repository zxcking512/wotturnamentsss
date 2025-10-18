import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './MischiefModal.css';

const MischiefModal = ({ isOpen, onClose, challengeId, onSuccess }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await api.getTeamsForMischief();
      setTeams(response);
    } catch (err) {
      setError('Ошибка загрузки списка команд');
      console.error('Load teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTeam) {
      setError('Выберите команду для пакости');
      return;
    }

    try {
      setLoading(true);
      const response = await api.selectMischiefTarget(challengeId, selectedTeam);
      
      if (response.success) {
        onSuccess(response.message, response.newBalance);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка выполнения пакости');
      console.error('Mischief error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mischief-modal-overlay">
      <div className="mischief-modal">
        <h2>Выберите цель для пакости</h2>
        <p>Забрать 10000 рублей у другой команды</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="teams-list">
          {loading ? (
            <div className="loading">Загрузка команд...</div>
          ) : (
            teams.map(team => (
              <div 
                key={team.id}
                className={`team-item ${selectedTeam === team.id ? 'selected' : ''}`}
                onClick={() => setSelectedTeam(team.id)}
              >
                <div className="team-name">{team.name}</div>
                <div className="team-balance">Баланс: {team.balance} руб</div>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button 
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            className="btn-primary"
            disabled={loading || !selectedTeam}
          >
            {loading ? 'Выполняется...' : 'Выбрать цель'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MischiefModal;