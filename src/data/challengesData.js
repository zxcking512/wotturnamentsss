export const challengesData = {
  common: [
    {
      id: 1,
      title: "ПРОСТАЯ ШАЛОСТЬ",
      description: "Снимите забавное видео с коллегами на рабочем месте длительностью не более 30 секунд",
      reward: 25000,
      image: "/images/cards/common/common-1.jpg"
    },
    {
      id: 2,
      title: "ВЕСЕЛАЯ ЗАДАЧА",
      description: "Организуйте мини-конкурс среди сотрудников вашего отдела",
      reward: 25000,
      image: "/images/cards/common/common-2.jpg"
    },
    {
      id: 3,
      title: "КОМАНДНАЯ ШУТКА",
      description: "Создайте креативный коллаж из фотографий команды",
      reward: 25000,
      image: "/images/cards/common/common-3.jpg"
    }
  ],
  
  epic: [
    {
      id: 101,
      title: "ЭПИЧЕСКОЕ БЕЗУМСТВИЕ",
      description: "Организуйте флешмоб с участием минимум 10 сотрудников в главном холле компании",
      reward: 50000,
      image: "/images/cards/epic/epic-1.jpg"
    },
    {
      id: 102,
      title: "ГРАНДИОЗНЫЙ ВЫЗОВ",
      description: "Снимите профессиональный юмористический ролик о жизни офиса длительностью 2-3 минуты",
      reward: 50000,
      image: "/images/cards/epic/epic-2.jpg"
    },
    {
      id: 103,
      title: "ЛЕГЕНДАРНАЯ АКЦИЯ",
      description: "Превратите ваше рабочее пространство в тематическую зону на весь день",
      reward: 50000,
      image: "/images/cards/epic/epic-3.jpg"
    }
  ],
  
  mischief: [
    {
      id: 201,
      title: "ОСОБАЯ СПОСОБНОСТЬ",
      description: "Выберите команду, баланс которой уменьшится на стоимость карты",
      reward: -10000,
      image: "/images/cards/mischief/mischief-1.jpg"
    },
    {
      id: 202,
      title: "ХИТРАЯ ПАКОСТЬ", 
      description: "Выберите команду, которая потеряет часть своего баланса",
      reward: -10000,
      image: "/images/cards/mischief/mischief-2.jpg"
    },
    {
      id: 203,
      title: "ВРЕДНАЯ ШУТКА",
      description: "Наслайте небольшие финансовые неприятности на другую команду",
      reward: -10000,
      image: "/images/cards/mischief/mischief-3.jpg"
    }
  ]
};

// Функция для получения случайных карточек
export const getRandomChallenges = (count = 3) => {
  const allChallenges = [
    ...challengesData.common,
    ...challengesData.epic, 
    ...challengesData.mischief
  ];
  
  // Перемешиваем массив
  const shuffled = [...allChallenges].sort(() => 0.5 - Math.random());
  
  // Берем нужное количество
  return shuffled.slice(0, count).map((challenge, index) => {
    // Определяем редкость по ID
    let rarity = 'common';
    if (challenge.id >= 100 && challenge.id < 200) rarity = 'epic';
    if (challenge.id >= 200) rarity = 'troll';
    
    return {
      ...challenge,
      rarity,
      uniqueKey: `${challenge.id}_${index}_${Date.now()}`
    };
  });
};