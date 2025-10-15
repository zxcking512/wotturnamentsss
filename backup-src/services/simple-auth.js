const API_BASE = 'http://localhost:3001';

export const simpleAuth = {
  async login(username, password) {
    try {
      console.log('🔐 Отправляем запрос на:', `${API_BASE}/api/auth/login`);
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('📨 Статус ответа:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Ответ сервера:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      return { 
        success: false, 
        message: `Не удалось подключиться к серверу: ${error.message}` 
      };
    }
  }
};