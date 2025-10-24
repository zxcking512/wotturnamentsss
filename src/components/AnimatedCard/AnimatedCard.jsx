import React, { useRef, useState, useCallback, useEffect } from 'react';
import './AnimatedCard.css';

const AnimatedCard = ({ 
  challenge, 
  onSelect, 
  canSelect = true,
  isReplacing = false,
  onReplaceComplete,
  teams = [],
  onTeamSelect,
  isMischiefCompleted = false,
  isTaskAccepted = false,
  isBlocked = false,
  onCardOpen
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mouseRotate, setMouseRotate] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  
  const cardRef = useRef(null);
  const boomVideoRef = useRef(null);
  const permanentGlowRef = useRef(null);
  const wrapperRef = useRef(null);
  
  const [isBoomPlaying, setIsBoomPlaying] = useState(false);
  const [hasSpecialRarity, setHasSpecialRarity] = useState(false);
  const [showPermanentGlow, setShowPermanentGlow] = useState(false);

  // НОВАЯ ЛОГИКА: проверяем можно ли открыть карточку
  const canOpenCard = !isBlocked && !isFlipped && !isExiting && !isMischiefCompleted && !isTaskAccepted && canSelect;

  const getCardImage = () => {
    const { rarity } = challenge;
    
    switch(rarity) {
      case 'epic':
        return '/images/cards/epic/epic-1.jpg';
      case 'common':
        return '/images/cards/common/common-1.jpg';
      case 'troll':
        return '/images/cards/mischief/mischief-1.jpg';
      default:
        return '/images/cards/common/common-1.jpg';
    }
  };

  const getVideoSources = () => {
    switch(challenge.rarity) {
      case 'epic':
        return {
          boom: '/videos/fire-boom.webm',
          permanent: '/videos/fire-ramka.webm'
        };
      case 'common':
        return {
          boom: '/videos/simple-boom.webm', 
          permanent: null
        };
      case 'troll':
        return {
          boom: '/videos/Magic-boom.webm',
          permanent: '/videos/magic-ramka.webm'
        };
      default:
        return {
          boom: '/videos/simple-boom.webm',
          permanent: null
        };
    }
  };

  const getTopBadgeSVG = (rarity) => {
    switch(rarity) {
      case 'epic':
        return (
          <svg width="160" height="28" viewBox="0 0 190 32" fill="none" preserveAspectRatio="xMidYMid meet">
            <path d="M0 0H190L181.038 32H8.96226L0 0Z" fill="#FF5000" fillOpacity="0.8"/>
          </svg>
        );
      case 'troll':
        return (
          <svg width="160" height="28" viewBox="0 0 190 32" fill="none" preserveAspectRatio="xMidYMid meet">
            <path d="M189.341 0.5L180.659 31.5H9.34082L0.65918 0.5H189.341Z" fill="#8733FE" fillOpacity="0.8" stroke="#8733FE"/>
          </svg>
        );
      case 'common':
      default:
        return (
          <svg width="160" height="28" viewBox="0 0 190 32" fill="none" preserveAspectRatio="xMidYMid meet">
            <path d="M189.341 0.5L180.659 31.5H9.34082L0.65918 0.5H189.341Z" fill="#555555" fillOpacity="0.7" stroke="#565656"/>
          </svg>
        );
    }
  };

  const getBottomBadgeSVG = (rarity) => {
    switch(rarity) {
      case 'epic':
        return (
          <svg width="200" height="38" viewBox="0 0 232 43" fill="none" preserveAspectRatio="xMidYMid meet">
            <path d="M20 0H212L232 43H0L20 0Z" fill="#FF5000" fillOpacity="0.8"/>
          </svg>
        );
      case 'troll':
        return (
          <svg width="200" height="38" viewBox="0 0 232 43" fill="none" preserveAspectRatio="xMidYMid meet">
            <path d="M211.682 0.5L231.216 42.5H0.78418L20.3184 0.5H211.682Z" fill="#6A01FE" fillOpacity="0.8" stroke="#8733FE"/>
          </svg>
        );
      case 'common':
      default:
        return (
          <svg width="200" height="38" viewBox="0 0 232 43" fill="none" preserveAspectRatio="xMidYMid meet">
            <path d="M211.682 0.5L231.216 42.5H0.78418L20.3184 0.5H211.682Z" fill="#555555" fillOpacity="0.7" stroke="#565656"/>
          </svg>
        );
    }
  };

  const videoSources = getVideoSources();

  useEffect(() => {
    setHasSpecialRarity(challenge.rarity === 'epic' || challenge.rarity === 'troll');
  }, [challenge.rarity]);

  useEffect(() => {
    if (isReplacing && !isExiting) {
      startExitAnimation();
    }
  }, [isReplacing, isExiting]);

  const startExitAnimation = () => {
    setIsExiting(true);
    
    setTimeout(() => {
      if (onReplaceComplete) {
        onReplaceComplete();
      }
    }, 600);
  };

  const handleCardClick = useCallback((e) => {
  if (!canOpenCard) return;

  e.stopPropagation();
  
  if (isBoomPlaying) return;

  console.log('Card clicked, starting animations...');
  
  // СНАЧАЛА запускаем взрыв, ПОТОМ переворот
  setIsBoomPlaying(true);
  if (boomVideoRef.current) {
    boomVideoRef.current.currentTime = 0;
    boomVideoRef.current.play().catch(err => {
      console.error('Video play error:', err);
    });
  }

  // Запускаем переворот с небольшой задержкой после начала взрыва
  setTimeout(() => {
    setIsFlipped(true);
    // ВЫЗЫВАЕМ КОЛБЕК ПОСЛЕ ПЕРЕВОРОТА с ID карточки
    if (onCardOpen) {
      onCardOpen(challenge.uniqueKey, challenge.rarity);
    }
  }, 150);

  // Запускаем постоянное свечение после взрыва
  setTimeout(() => {
    if (hasSpecialRarity && videoSources.permanent && permanentGlowRef.current) {
      setShowPermanentGlow(true);
      permanentGlowRef.current.currentTime = 0;
      permanentGlowRef.current.play().catch(err => {
        console.error('Permanent glow video error:', err);
      });
    }
  }, 700);

}, [canOpenCard, isBoomPlaying, hasSpecialRarity, videoSources.permanent, onCardOpen, challenge.uniqueKey, challenge.rarity]);

  const handleBoomEnded = useCallback(() => {
    console.log('Boom animation ended');
    setIsBoomPlaying(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || isExiting || isMischiefCompleted || isTaskAccepted || isBlocked) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const baseRotateX = (y - centerY) / centerY * 6;
    const baseRotateY = (x - centerX) / centerX * -10;
    
    if (!isFlipped) {
      setMouseRotate({ x: -baseRotateX, y: -baseRotateY });
    } else {
      setMouseRotate({ x: baseRotateX, y: baseRotateY });
    }
  }, [isFlipped, isExiting, isMischiefCompleted, isTaskAccepted, isBlocked]);

  const handleMouseLeave = useCallback(() => {
    setMouseRotate({ x: 0, y: 0 });
  }, []);

  const handleTakeTask = (e) => {
    e.stopPropagation();
    
    if (challenge.rarity === 'troll' && !selectedTeam) {
      alert('Пожалуйста, выберите команду для пакости!');
      return;
    }
    
    onSelect && onSelect(challenge, selectedTeam);
  };

  const handleTeamSelect = (e) => {
    const teamId = e.target.value;
    setSelectedTeam(teamId);
    onTeamSelect && onTeamSelect(challenge, teamId);
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'ЭПИЧЕСКОЕ БЕЗУМСТВИЕ';
      case 'common': return 'ПРОСТАЯ ШАЛОСТЬ';
      case 'troll': return 'ОСОБАЯ СПОСОБНОСТЬ';
      default: return rarity;
    }
  };

  const formatReward = (reward) => {
    if (reward > 0) {
      return `+${reward.toLocaleString('ru-RU')} РУБ.`;
    } else if (reward < 0) {
      return `${reward.toLocaleString('ru-RU')} РУБ.`;
    }
    return '0 РУБ.';
  };

  const getMischiefDescription = () => {
    return "Выберите команду, баланс которой уменьшится на стоимость карты";
  };

  const cardImage = getCardImage();

  const wrapperClassName = `animated-card-wrapper ${isExiting ? 'card-exit' : ''} ${isBlocked ? 'card-blocked' : ''}`;
  const cardClassName = `animated-card ${challenge.rarity} ${isFlipped ? 'flipped' : ''} ${!canSelect ? 'disabled' : ''} ${isMischiefCompleted ? 'mischief-completed' : ''} ${isTaskAccepted ? 'task-accepted' : ''} ${isBlocked ? 'blocked' : ''} with-parallax`;

  const getTransformStyle = () => {
    let transform = '';
    
    if (isFlipped) {
      transform = `rotateY(180deg) rotateX(${mouseRotate.x}deg) rotateY(${mouseRotate.y}deg)`;
    } else {
      transform = `rotateX(${mouseRotate.x}deg) rotateY(${mouseRotate.y}deg)`;
    }
    
    if (cardRef.current) {
      cardRef.current.style.setProperty('--mouse-x', `${mouseRotate.x}deg`);
      cardRef.current.style.setProperty('--mouse-y', `${mouseRotate.y}deg`);
    }
    
    return transform;
  };

  return (
    <div 
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ animationDelay: `${(challenge.id % 3) * 0.1}s` }}
    >
      {(hasSpecialRarity && videoSources.permanent) && (
        <div className="glow-container">
          <video
            ref={permanentGlowRef}
            className={`permanent-glow-video ${showPermanentGlow ? 'is-visible' : ''}`}
            playsInline
            muted
            loop
            src={videoSources.permanent}
          />
        </div>
      )}
      
      {videoSources.boom && (
        <div className="boom-video-container">
          <video
            ref={boomVideoRef}
            className={`boom-video ${isBoomPlaying ? 'is-visible' : ''}`}
            playsInline
            muted
            onEnded={handleBoomEnded}
            onError={(e) => {
              console.error('Boom video error:', e);
            }}
            src={videoSources.boom}
          />
        </div>
      )}
      
      <div 
        ref={cardRef}
        className={cardClassName}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="card-3d-container"
          style={{ transform: getTransformStyle() }}
        >
          
          <div className="card-front">
            {/* Рубашка карточки */}
          </div>

          <div className="card-back">
            <div className="card-back-background"></div>
            
            <div className="card-back-content">
              <div 
                className="card-image-section"
                style={{ backgroundImage: `url(${cardImage})` }}
              >
                <div className="card-rarity-badge">
                  <div className="rarity-svg">
                    {getTopBadgeSVG(challenge.rarity)}
                  </div>
                  <div className="rarity-text">{getRarityName(challenge.rarity)}</div>
                </div>

                <div className="card-reward-badge">
                  <div className="reward-svg">
                    {getBottomBadgeSVG(challenge.rarity)}
                    <div className="reward-text">{formatReward(challenge.reward)}</div>
                  </div>
                </div>
              </div>

              <div className="card-content-section">
                <h3 className="card-title">{challenge.title}</h3>
                
                <div className="card-description">
                  {challenge.rarity === 'troll' ? getMischiefDescription() : challenge.description}
                </div>

                {challenge.rarity === 'troll' && (
                  <div className="team-select-container">
                    <select 
                      value={selectedTeam} 
                      onChange={handleTeamSelect}
                      className="team-select"
                      disabled={!canSelect || isExiting || isMischiefCompleted || isTaskAccepted || isBlocked}
                    >
                      <option value="">Выберите команду</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.balance?.toLocaleString('ru-RU')} руб.)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="card-button-container">
              <button
                onClick={handleTakeTask}
                className={`take-task-btn ${challenge.rarity === 'troll' ? 'mischief-btn' : ''}`}
                disabled={!canSelect || isExiting || (challenge.rarity === 'troll' && !selectedTeam) || isMischiefCompleted || isTaskAccepted || isBlocked}
              >
                {challenge.rarity === 'troll' ? 'Сделать пакость' : 'Принять задание'}
              </button>
            </div>
          </div>

        </div>
        
        {isMischiefCompleted && !isBlocked && (
          <div className="mischief-completed-overlay">
            <div className="mischief-success-title">
              ПАКОСТЬ<br />УДАЛАСЬ!
            </div>
            <div className="mischief-success-message">
              Команда противника получила -10 000 руб. к балансу. Вы можете открыть другую карту.
            </div>
          </div>
        )}
        
        {isTaskAccepted && (
          <div className="task-accepted-overlay">
            <div className="task-accepted-title">
              ЗАДАНИЕ<br />ПРИНЯТО!
            </div>
            <div className="task-accepted-message">
              Отметить как выполненное или отменить текущее задание вы можете на странице "Моя команда"
            </div>
          </div>
        )}
        
        {/* УБИРАЕМ СООБЩЕНИЕ О БЛОКИРОВКЕ - ОСТАВЛЯЕМ ТОЛЬКО ЗАТЕМНЕНИЕ */}
        {isBlocked && !isFlipped && (
          <div className="card-blocked-overlay">
            <div className="blocked-message">
              {/* Сообщение скрыто через CSS */}
            </div>
          </div>
        )}
        
        {canOpenCard && (
          <div 
            className="card-click-area"
            onClick={handleCardClick}
          />
        )}
      </div>
    </div>
  );
};

export default AnimatedCard;