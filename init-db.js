import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Таблица команд
  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    balance INTEGER DEFAULT 0,
    completed_challenges INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица пользователей
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'captain',
    team_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Остальные таблицы
  db.run(`CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL,
    reward INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (challenge_id) REFERENCES challenges (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS used_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    replaced BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (challenge_id) REFERENCES challenges (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`);

  // Настройки вероятностей
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('epic_probability', '10'),
    ('rare_probability', '30'),
    ('common_probability', '50'),
    ('troll_probability', '10')
  `);

  // Создаем команды
  const teams = [
    { name: 'Bratishkinoff', balance: 100000 },
    { name: 'Shadowkek', balance: 100000 },
    { name: 'Levsha', balance: 100000 },
    { name: 'Recrent', balance: 100000 }
  ];

  teams.forEach(team => {
    db.run('INSERT OR IGNORE INTO teams (name, balance) VALUES (?, ?)', [team.name, team.balance]);
  });

  // Ждем создания команд, затем создаем пользователей
  setTimeout(() => {
    // Создаем пользователей
    const users = [
      // Капитаны
      { login: 'bratishkinoff', password: 'brat123', role: 'captain', teamName: 'Bratishkinoff' },
      { login: 'shadowkek', password: 'shadow123', role: 'captain', teamName: 'Shadowkek' },
      { login: 'levsha', password: 'levsha123', role: 'captain', teamName: 'Levsha' },
      { login: 'recrent', password: 'recrent123', role: 'captain', teamName: 'Recrent' },
      // Модератор
      { login: 'moderator', password: 'moderator123', role: 'moderator', teamName: null }
    ];

    users.forEach(user => {
      if (user.teamName) {
        // Для капитанов находим ID команды
        db.get('SELECT id FROM teams WHERE name = ?', [user.teamName], (err, team) => {
          if (team && !err) {
            const hashedPassword = bcrypt.hashSync(user.password, 10);
            db.run(
              'INSERT OR IGNORE INTO users (login, password_hash, role, team_id) VALUES (?, ?, ?, ?)',
              [user.login, hashedPassword, user.role, team.id]
            );
          }
        });
      } else {
        // Для модератора
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        db.run(
          'INSERT OR IGNORE INTO users (login, password_hash, role, team_id) VALUES (?, ?, ?, ?)',
          [user.login, hashedPassword, user.role, null]
        );
      }
    });

    // Добавляем тестовые задания
    const sampleChallenges = [
      {title: 'Эпическое безумство 1', description: 'Выиграть 5 боев подряд с уроном выше 3000', rarity: 'epic', reward: 50000},
      {title: 'Эпическое безумство 2', description: 'Уничтожить 3 танка за 1 минуту боя', rarity: 'epic', reward: 50000},
      {title: 'Дерзкий вызов 1', description: 'Выиграть бой с уроном 4000+', rarity: 'rare', reward: 25000},
      {title: 'Дерзкий вызов 2', description: 'Уничтожить 5 танков за бой', rarity: 'rare', reward: 25000},
      {title: 'Простая шалость 1', description: 'Выиграть 3 боя', rarity: 'common', reward: 5000},
      {title: 'Простая шалость 2', description: 'Нанести 2000 урона за бой', rarity: 'common', reward: 5000},
      {title: 'Пакость', description: 'Забрать 10000 рублей у другой команды', rarity: 'troll', reward: -10000}
    ];

    sampleChallenges.forEach(challenge => {
      db.run(
        'INSERT OR IGNORE INTO challenges (title, description, rarity, reward) VALUES (?, ?, ?, ?)',
        [challenge.title, challenge.description, challenge.rarity, challenge.reward]
      );
    });

    console.log('Database initialized successfully!');
    console.log('=== АККАУНТЫ ДЛЯ ВХОДА ===');
    console.log('Капитаны:');
    console.log('Bratishkinoff: bratishkinoff / brat123');
    console.log('Shadowkek: shadowkek / shadow123');
    console.log('Levsha: levsha / levsha123');
    console.log('Recrent: recrent / recrent123');
    console.log('Модератор: moderator / moderator123');
    console.log('========================');
  }, 100);
});

db.close();