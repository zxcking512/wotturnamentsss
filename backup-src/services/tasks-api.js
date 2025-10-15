const API_BASE = 'http://localhost:3001';

export const tasksApi = {
  // Получение случайных заданий
  async getRandomTasks() {
    try {
      console.log('🎴 Запрашиваем задания с:', `${API_BASE}/api/tasks/random`);
      
      const response = await fetch(`${API_BASE}/api/tasks/random`);
      
      console.log('📨 Статус ответа:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Получены задания:', data.tasks?.length || 0);
      
      return data;
    } catch (error) {
      console.error('❌ Ошибка получения заданий:', error);
      // Возвращаем тестовые данные если сервер не доступен
      return { 
        success: true, 
        tasks: [
          {
            id: '1',
            title: 'БЕЗУМНЫЙ ТАНКИСТ',
            description: 'Взвод должен провести бой на карте "Проверка" на танках одного типа. Нужно одержать победу.',
            rarity: 'epic',
            reward: 50000
          },
          {
            id: '2',
            title: 'ПОСЛЕДНИЙ ШАНС',
            description: 'Провести 3 боя, в которых каждый участник наносит не менее 1000 урона.',
            rarity: 'rare', 
            reward: 25000
          },
          {
            id: '3',
            title: 'ПРОСТАЯ ШАЛОСТЬ',
            description: 'Выиграть бой на технике не выше 6 уровня всей командой.',
            rarity: 'common',
            reward: 5000
          }
        ]
      };
    }
  },

  // Взятие задания
  async takeTask(teamId, taskId) {
    try {
      console.log('📥 Отправляем запрос на взятие задания...');
      
      const response = await fetch(`${API_BASE}/api/tasks/take`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, taskId })
      });

      const data = await response.json();
      console.log('✅ Ответ на взятие задания:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Ошибка взятия задания:', error);
      return { 
        success: true, 
        message: 'Задание успешно принято! (тестовый режим)'
      };
    }
  },

  // Получение данных команды
  async getTeamData(teamId) {
    try {
      console.log('📊 Запрашиваем данные команды:', teamId);
      
      // В реальности здесь будет запрос к API
      // Пока возвращаем тестовые данные
      return {
        success: true,
        team: {
          id: teamId,
          balance: 200000,
          completedTasks: 10,
          freeCancels: 3,
          currentTask: {
            id: 'current-1',
            title: 'БЕЗУМНЫЙ ТАНКИСТ',
            description: 'Взвод должен провести бой на карте "Проверка" на танках одного типа. Нужно одержать победу.',
            rarity: 'epic',
            reward: 50000,
            status: 'active',
            takenAt: '2024-11-23'
          }
        }
      };
    } catch (error) {
      console.error('❌ Ошибка получения данных команды:', error);
      return { success: false, message: 'Ошибка загрузки данных' };
    }
  },

  // Завершение задания
  async completeTask(teamId, taskId) {
    try {
      console.log('✅ Завершаем задание:', { teamId, taskId });
      
      // В реальности здесь будет запрос к API
      // Пока имитируем успешный ответ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Задание успешно завершено!'
      };
    } catch (error) {
      console.error('❌ Ошибка завершения задания:', error);
      return { success: false, message: 'Ошибка завершения задания' };
    }
  },

  // Отмена задания
  async cancelTask(teamId, taskId, penalty) {
    try {
      console.log('❌ Отменяем задание:', { teamId, taskId, penalty });
      
      // В реальности здесь будет запрос к API
      // Пока имитируем успешный ответ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: penalty > 0 
          ? `Задание отменено (штраф ${penalty} руб.)`
          : 'Задание отменено (бесплатная отмена)'
      };
    } catch (error) {
      console.error('❌ Ошибка отмены задания:', error);
      return { success: false, message: 'Ошибка отмены задания' };
    }
  },

  // Получение истории заданий
  async getTaskHistory(teamId) {
    try {
      console.log('📜 Запрашиваем историю заданий:', teamId);
      
      // В реальности здесь будет запрос к API
      // Пока возвращаем тестовые данные
      return {
        success: true,
        history: [
          {
            id: 'h1',
            title: 'СНАЙПЕРСКАЯ ДУЭЛЬ',
            reward: 25000,
            status: 'completed',
            completedAt: '2024-11-20'
          },
          {
            id: 'h2', 
            title: 'ТАНКОВЫЙ МАРАФОН',
            reward: 50000,
            status: 'completed',
            completedAt: '2024-11-18'
          }
        ]
      };
    } catch (error) {
      console.error('❌ Ошибка получения истории:', error);
      return { success: false, message: 'Ошибка загрузки истории' };
    }
  }
};