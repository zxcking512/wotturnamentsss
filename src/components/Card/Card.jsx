import React from 'react';
import './Card.css';

const Card = ({ challenge, onSelect, isSelected = false, canSelect = true }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'epic': return '#ff6b35';
      case 'rare': return '#4cc9f0';
      case 'common': return '#4ade80';
      case 'troll': return '#f72585';
      default: return '#6b7280';
    }
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'Эпическое безумство';
      case 'rare': return 'Дерзкий вызов';
      case 'common': return 'Простая шалость';
      case 'troll': return 'Пакость';
      default: return rarity;
    }
  };

  const getCardClass = () => {
    let className = 'card';
    if (isSelected) className += ' card--selected';
    if (!canSelect) className += ' card--disabled';
    className += ` card--${challenge.rarity}`;
    return className;
  };

  return (
    <div 
      className={getCardClass()}
      onClick={() => canSelect && onSelect && onSelect(challenge)}
      style={{ borderColor: getRarityColor(challenge.rarity) }}
    >
      <div className="card__header" style={{ backgroundColor: getRarityColor(challenge.rarity) }}>
        <span className="card__rarity">{getRarityName(challenge.rarity)}</span>
        <span className="card__reward">
          {challenge.reward > 0 ? `+${challenge.reward} руб` : `${challenge.reward} руб`}
        </span>
      </div>
      
      <div className="card__content">
        <h3 className="card__title">{challenge.title}</h3>
        <p className="card__description">{challenge.description}</p>
      </div>
      
      <div className="card__footer">
        {canSelect && (
          <button 
            className={`card__button ${isSelected ? 'card__button--selected' : ''}`}
            disabled={!canSelect}
          >
            {isSelected ? 'Выбрано' : 'Выбрать'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;