import React, { useState } from 'react';
import './Card.css';

const Card = ({ challenge, onSelect, canSelect = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'ЭПИЧЕСКОЕ БЕЗУМСТВО';
      case 'rare': return 'ДЕРЗКИЙ ВЫЗОВ';
      case 'common': return 'ПРОСТАЯ ШАЛОСТЬ';
      case 'troll': return 'ПАКОСТЬ';
      default: return rarity;
    }
  };

  const handleCardClick = () => {
    if (!canSelect) return;
    setIsOpen(!isOpen);
  };

  const handleTakeTask = (e) => {
    e.stopPropagation();
    onSelect && onSelect(challenge);
  };

  const formatReward = (reward) => {
    if (reward > 0) {
      return `+${reward.toLocaleString('ru-RU')} РУБ.`;
    } else if (reward < 0) {
      return `${reward.toLocaleString('ru-RU')} РУБ.`;
    }
    return '0 РУБ.';
  };

  return (
    <div 
      className={`card ${isOpen ? 'flipped' : ''} ${challenge.rarity} ${!canSelect ? 'disabled' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-inner">
        {/* ЛИЦЕВАЯ СТОРОНА (РУБАШКА) */}
        <div className="card-front">
          {/* Для всех карт фон загружается через CSS */}
        </div>
        
        {/* ОБОРОТНАЯ СТОРОНА */}
        <div className="card-back">
          <div className="card-rarity">{getRarityName(challenge.rarity)}</div>
          <div className="card-reward">
            {formatReward(challenge.reward)}
          </div>
          <h3 className="card-title">{challenge.title}</h3>
          <p className="card-description">{challenge.description}</p>
          
          <button
            onClick={handleTakeTask}
            className={`take-task-btn ${challenge.rarity === 'troll' ? 'mischief-btn' : ''}`}
            disabled={!canSelect}
          >
            {challenge.rarity === 'troll' ? 'СДЕЛАТЬ ПАКОСТЬ' : 'ВЗЯТЬ ЗАДАНИЕ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;