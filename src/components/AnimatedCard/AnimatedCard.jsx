import React, { useRef, useState, useCallback, useEffect } from 'react';
import './AnimatedCard.css';

const AnimatedCard = ({ 
  challenge, 
  onSelect, 
  canSelect = true,
  isReplacing = false,
  onReplaceComplete
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mouseRotate, setMouseRotate] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  
  const cardRef = useRef(null);
  const boomVideoRef = useRef(null);
  const permanentGlowRef = useRef(null);
  const wrapperRef = useRef(null);
  
  const [isBoomPlaying, setIsBoomPlaying] = useState(false);
  const [hasSpecialRarity, setHasSpecialRarity] = useState(false);
  const [showPermanentGlow, setShowPermanentGlow] = useState(false);

  // Функция для получения изображения карточки
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

  const videoSources = getVideoSources();

  useEffect(() => {
    setHasSpecialRarity(challenge.rarity === 'epic' || challenge.rarity === 'troll');
  }, [challenge.rarity]);

  // Обработка анимации замены карточек
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
    if (!canSelect || isFlipped || isExiting) return;

    e.stopPropagation();
    
    if (isBoomPlaying) return;

    console.log('Card clicked, starting animations...');
    
    // СРАЗУ начинаем переворот карточки
    setIsFlipped(true);
    
    // И запускаем взрыв одновременно с переворотом
    setIsBoomPlaying(true);
    if (boomVideoRef.current) {
      boomVideoRef.current.currentTime = 0;
      boomVideoRef.current.play().catch(err => {
        console.error('Video play error:', err);
      });
    }

    // Через 400ms (середина переворота) запускаем постоянное свечение
    setTimeout(() => {
      if (hasSpecialRarity && permanentGlowRef.current) {
        setShowPermanentGlow(true);
        permanentGlowRef.current.currentTime = 0;
        permanentGlowRef.current.play().catch(err => {
          console.error('Permanent glow video error:', err);
        });
      }
    }, 400);

  }, [canSelect, isBoomPlaying, isFlipped, isExiting, hasSpecialRarity]);

  const handleBoomEnded = useCallback(() => {
    console.log('Boom animation ended');
    setIsBoomPlaying(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || !isFlipped || isExiting) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / centerY * -8;
    const rotateY = (x - centerX) / centerX * 8;
    
    setMouseRotate({ x: rotateX, y: rotateY });
  }, [isFlipped, isExiting]);

  const handleMouseLeave = useCallback(() => {
    setMouseRotate({ x: 0, y: 0 });
  }, []);

  const handleTakeTask = (e) => {
    e.stopPropagation();
    onSelect && onSelect(challenge);
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'epic': return 'ЭПИЧЕСКОЕ БЕЗУМСТВО';
      case 'rare': return 'ДЕРЗКИЙ ВЫЗОВ';
      case 'common': return 'ПРОСТАЯ ШАЛОСТЬ';
      case 'troll': return 'ПАКОСТЬ';
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

  const cardImage = getCardImage();

  const wrapperClassName = `animated-card-wrapper ${isExiting ? 'card-exit' : ''}`;
  const cardClassName = `animated-card ${challenge.rarity} ${isFlipped ? 'flipped' : ''} ${!canSelect ? 'disabled' : ''}`;

  return (
    <div 
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ animationDelay: `${(challenge.id % 3) * 0.1}s` }}
    >
      {/* Контейнер для свечения */}
      {hasSpecialRarity && videoSources.permanent && (
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
      
      {/* Основная карточка */}
      <div 
        ref={cardRef}
        className={cardClassName}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-3d-container">
          
          {/* Лицевая сторона (рубашка) */}
          <div className="card-front">
            {/* Видео взрыва */}
            {videoSources.boom && (
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
            )}
          </div>

          {/* Оборотная сторона по новому макету */}
          <div className="card-back">
            {/* Фон рубашки для всей карточки */}
            <div className="card-back-background"></div>
            
            {/* Верхний блок с изображением */}
            <div 
              className="card-image-section"
              style={{ backgroundImage: `url(${cardImage})` }}
            >
              {/* Верхний оранжевый блок с текстом редкости */}
              <div className="card-rarity-badge">
                <div className="card-rarity-text">{getRarityName(challenge.rarity)}</div>
              </div>

              {/* Нижний оранжевый блок с наградой */}
              <div className="card-reward-badge">
                <svg className="reward-svg" width="232" height="43" viewBox="0 0 232 43" fill="none">
                  <path d="M20 0H212L232 43H0L20 0Z" fill="#FF5000" fillOpacity="0.8"/>
                </svg>
                <div className="reward-text">{formatReward(challenge.reward)}</div>
              </div>
            </div>

            {/* Нижний блок с контентом */}
            <div className="card-content-section">
              <div 
                className="card-back-content"
                style={{
                  transform: `rotateX(${mouseRotate.x}deg) rotateY(${mouseRotate.y}deg)`
                }}
              >
                {/* Название карточки */}
                <h3 className="card-title">{challenge.title}</h3>
                
                {/* Описание карточки */}
                <div className="card-description">
                  {challenge.description}
                </div>
                
                {/* Кнопка принять задание */}
                <button
                  onClick={handleTakeTask}
                  className={`take-task-btn ${challenge.rarity === 'troll' ? 'mischief-btn' : ''}`}
                  disabled={!canSelect || isExiting}
                >
                  {challenge.rarity === 'troll' ? 'СДЕЛАТЬ ПАКОСТЬ' : 'ПРИНЯТЬ ЗАДАНИЕ'}
                </button>
              </div>
            </div>
          </div>

        </div>
        
        {/* Кликабельная область для карточки */}
        {!isFlipped && !isExiting && (
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