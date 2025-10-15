const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// 🔧 FIX CORS - разрешаем все запросы
app.use(cors());
app.use(express.json());

// Простые тестовые данные в памяти
const users = [
  {
    id: '1',
    username: 'recrent',
    password: 'password123',
    role: 'captain',
    teamName: 'RECRENT',
    balance: 200000,
    completedTasks: 10,
    currentTask: { status: 'none' },
    freeCancels: 3
  },
  {
    id: '2',
    username: 'admin',
    password: 'password123',
    role: 'moderator',
    teamName: 'ADMIN',
    balance: 0,
    completedTasks: 0,
    currentTask: { status: 'none' },
    freeCancels: 3
  }
];

// ==================== API МАРШРУТЫ ====================

// Проверка здоровья
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Сервер работает!',
    timestamp: new Date().toISOString()
  });
});

// Главная страница API
app.get('/api', (req, res) => {
  res.json({ 
    message: '🚀 WoT Tournament API работает!',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health - статус сервера',
      'POST /api/auth/login - авторизация',
      'GET  /api/teams - все команды'
    ]
  });
});

// Авторизация
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Получен запрос авторизации:', { username, password });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      });
    }

    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      console.log('❌ Неверные данные:', username);
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль'
      });
    }

    console.log('✅ Успешная авторизация:', user.username);

    // Создаем простой токен
    const token = 'token-' + Date.now();

    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teamName: user.teamName,
        balance: user.balance,
        completedTasks: user.completedTasks,
        currentTask: user.currentTask,
        freeCancels: user.freeCancels
      }
    });

  } catch (error) {
    console.error('❌ Ошибка авторизации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение всех команд
app.get('/api/teams', (req, res) => {
  try {
    const teams = users.filter(user => user.role === 'captain');
    
    res.json({
      success: true,
      teams: teams.map(team => ({
        id: team.id,
        name: team.teamName,
        balance: team.balance,
        completedTasks: team.completedTasks,
        currentTask: team.currentTask
      }))
    });

  } catch (error) {
    console.error('Ошибка получения команд:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('🎯 ====================================');
  console.log('🚀 Сервер запущен!');
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log('👥 Тестовые пользователи:');
  console.log('   - recrent / password123 (Капитан)');
  console.log('   - admin / password123 (Модератор)');
  console.log('🎯 ====================================');
});

// Обработка завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Сервер остановлен');
  process.exit(0);
});