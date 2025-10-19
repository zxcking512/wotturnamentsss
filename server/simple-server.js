import express from 'express';
import cors from 'cors';
import session from 'express-session';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ← ДОБАВЬ ЭТОТ БЛОК CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.52:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'wot-tournament-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// MIDDLEWARE ДЛЯ ПРОВЕРКИ АВТОРИЗАЦИИ API
app.use('/api', (req, res, next) => {
    // Пропускаем только auth endpoints без проверки
    if (req.path.includes('/auth/')) {
        return next();
    }
    
    // Для всех остальных API endpoints проверяем авторизацию
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }
    
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

const db = new sqlite3.Database('./server/database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDB(db);
    }
});

function initDB(db) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'captain',
            team_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            balance INTEGER DEFAULT 0,
            completed_challenges INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

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

        db.run(`CREATE TABLE IF NOT EXISTS mischief_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            target_team_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (challenge_id) REFERENCES challenges (id),
            FOREIGN KEY (target_team_id) REFERENCES teams (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )`);

        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
            ('epic_probability', '10'),
            ('rare_probability', '30'),
            ('common_probability', '50'),
            ('troll_probability', '10')
        `);

        const sampleChallenges = [
            {title: 'Эпическое безумство 1', description: 'Выиграть 5 боев подряд с уроном выше 3000', rarity: 'epic', reward: 50000},
            {title: 'Эпическое безумство 2', description: 'Уничтожить 3 танка за 1 минуту боя', rarity: 'epic', reward: 50000},
            {title: 'Эпическое безумство 3', description: 'Занять 1 место в рейтинге команды', rarity: 'epic', reward: 15000},
            {title: 'Дерзкий вызов 1', description: 'Выиграть бой с уроном 4000+', rarity: 'rare', reward: 25000},
            {title: 'Дерзкий вызов 2', description: 'Уничтожить 5 танков за бой', rarity: 'rare', reward: 25000},
            {title: 'Дерзкий вызов 3', description: 'Победить в 3 боях подряд', rarity: 'rare', reward: 12000},
            {title: 'Простая шалость 1', description: 'Выиграть 3 боя', rarity: 'common', reward: 5000},
            {title: 'Простая шалость 2', description: 'Нанести 2000 урона за бой', rarity: 'common', reward: 5000},
            {title: 'Простая шалость 3', description: 'Сбить 1000 урона за один бой', rarity: 'common', reward: 3000},
            {title: 'Пакость', description: 'Забрать 10000 рублей у другой команды', rarity: 'troll', reward: -10000},
            {title: 'Пакость 2', description: 'Использовать способность 5 раз за бой', rarity: 'troll', reward: 2000}
        ];

        const insertChallenge = db.prepare(`INSERT OR IGNORE INTO challenges (title, description, rarity, reward) VALUES (?, ?, ?, ?)`);
        sampleChallenges.forEach(challenge => {
            insertChallenge.run([challenge.title, challenge.description, challenge.rarity, challenge.reward]);
        });
        insertChallenge.finalize();

        // Сначала создаем команды и получаем их ID
        const teams = [
            { name: 'Bratishkinoff', balance: 100000 },
            { name: 'Shadowkek', balance: 100000 },
            { name: 'Levsha', balance: 100000 },
            { name: 'Recrent', balance: 100000 }
        ];

        // Удаляем старые данные чтобы пересоздать правильно
        db.run(`DELETE FROM users`);
        db.run(`DELETE FROM teams`);

        const teamInsert = db.prepare(`INSERT INTO teams (name, balance) VALUES (?, ?)`);
        teams.forEach(team => {
            teamInsert.run([team.name, team.balance]);
        });
        teamInsert.finalize();

        // Ждем пока команды создадутся и получаем их ID
        db.all(`SELECT id, name FROM teams ORDER BY id`, (err, teamRows) => {
            if (err) {
                console.error('Error getting team IDs:', err);
                return;
            }

            console.log('Created teams:', teamRows);

            const teamMap = {};
            teamRows.forEach(team => {
                teamMap[team.name] = team.id;
            });

            const moderatorPassword = bcrypt.hashSync('moderator123', 10);
            db.run(`INSERT OR IGNORE INTO users (login, password_hash, role) VALUES (?, ?, ?)`, 
                ['moderator', moderatorPassword, 'moderator']);

            // Создаем капитанов с правильными team_id
            const captains = [
                { login: 'bratishkin', password: 'bratishkin123', teamName: 'Bratishkinoff' },
                { login: 'shadow', password: 'shadow123', teamName: 'Shadowkek' },
                { login: 'levsha', password: 'levsha123', teamName: 'Levsha' },
                { login: 'recrent', password: 'recrent123', teamName: 'Recrent' }
            ];

            const captainInsert = db.prepare(`INSERT INTO users (login, password_hash, role, team_id) VALUES (?, ?, ?, ?)`);
            captains.forEach(captain => {
                const teamId = teamMap[captain.teamName];
                if (teamId) {
                    const hashedPassword = bcrypt.hashSync(captain.password, 10);
                    captainInsert.run([captain.login, hashedPassword, 'captain', teamId]);
                    console.log(`Created captain: ${captain.login} for team: ${captain.teamName} (ID: ${teamId})`);
                } else {
                    console.error(`Team not found for captain: ${captain.login}, team: ${captain.teamName}`);
                }
            });
            captainInsert.finalize();

            console.log('Database initialized successfully');
            console.log('Test accounts:');
            console.log('Moderator: moderator / moderator123');
            captains.forEach(captain => {
                console.log(`${captain.login} / ${captain.password} (Team: ${captain.teamName})`);
            });
        });
    });
}

function getAvailableChallengesCount(userId, callback) {
    db.get("SELECT COUNT(*) as total FROM challenges WHERE is_active = 1", (err, totalRow) => {
        if (err) return callback(err);
        
        // ИСКЛЮЧАЕМ ТОЛЬКО НЕ-ПАКОСТИ из used_challenges
        db.get(`SELECT COUNT(DISTINCT uc.challenge_id) as used 
                FROM used_challenges uc 
                JOIN challenges c ON uc.challenge_id = c.id 
                WHERE uc.user_id = ? AND uc.replaced = 0 AND c.rarity != 'troll'`, 
            [userId], (err, usedRow) => {
            if (err) return callback(err);
            
            const availableCount = totalRow.total - usedRow.used;
            callback(null, availableCount, totalRow.total);
        });
    });
}

function generateChallengeSet(allChallenges, probabilities) {
    const selectedChallenges = [];
    const usedRarities = new Set();
    
    // Создаем пул карт по редкостям
    const challengesByRarity = {
        epic: allChallenges.filter(c => c.rarity === 'epic'),
        rare: allChallenges.filter(c => c.rarity === 'rare'),
        common: allChallenges.filter(c => c.rarity === 'common'),
        troll: allChallenges.filter(c => c.rarity === 'troll')
    };
    
    for (let i = 0; i < 3; i++) {
        let selectedChallenge = null;
        let attempts = 0;
        
        while (!selectedChallenge && attempts < 10) {
            const random = Math.random() * 100;
            let selectedRarity = '';
            
            if (random < probabilities.epic_probability) {
                selectedRarity = 'epic';
            } else if (random < probabilities.epic_probability + probabilities.rare_probability) {
                selectedRarity = 'rare';
            } else if (random < probabilities.epic_probability + probabilities.rare_probability + probabilities.common_probability) {
                selectedRarity = 'common';
            } else {
                selectedRarity = 'troll';
            }
            
            // Проверяем ограничения: только 1 эпическая и 1 пакость в наборе
            if ((selectedRarity === 'epic' && usedRarities.has('epic')) ||
                (selectedRarity === 'troll' && usedRarities.has('troll'))) {
                attempts++;
                continue;
            }
            
            const availableChallenges = challengesByRarity[selectedRarity];
            if (availableChallenges && availableChallenges.length > 0) {
                selectedChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
                usedRarities.add(selectedRarity);
            }
            
            attempts++;
        }
        
        // Если не удалось выбрать по вероятностям, берем любую доступную
        if (!selectedChallenge) {
            const available = allChallenges.filter(challenge => 
                !selectedChallenges.includes(challenge)
            );
            if (available.length > 0) {
                selectedChallenge = available[Math.floor(Math.random() * available.length)];
            }
        }
        
        if (selectedChallenge) {
            selectedChallenges.push(selectedChallenge);
        }
    }
    
    return selectedChallenges;
}

// Новый API для получения списка команд для пакости
app.get('/api/teams/for-mischief', (req, res) => {
    const currentTeamId = req.session.user.team_id;

    db.all(`SELECT id, name, balance FROM teams WHERE id != ? ORDER BY name`, [currentTeamId], (err, teams) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(teams);
    });
});

// Новый API для выбора цели пакости
app.post('/api/challenges/select-mischief-target', (req, res) => {
    const { challengeId, targetTeamId } = req.body;
    const userId = req.session.user.id;
    const userTeamId = req.session.user.team_id;

    if (!challengeId || !targetTeamId) {
        return res.status(400).json({ error: 'Challenge ID and target team ID required' });
    }

    // Проверяем что выбранная команда не своя
    if (targetTeamId == userTeamId) {
        return res.status(400).json({ error: 'Нельзя выбрать свою команду как цель пакости' });
    }

    db.serialize(() => {
        // Сохраняем выбранную цель
        db.run(`INSERT INTO mischief_targets (user_id, challenge_id, target_team_id) VALUES (?, ?, ?)`, 
            [userId, challengeId, targetTeamId]);

        // Активируем задание
        db.run(`INSERT INTO user_challenges (user_id, challenge_id, status) VALUES (?, ?, 'active')`, 
            [userId, challengeId]);

        // Получаем информацию о пакости
        db.get(`SELECT * FROM challenges WHERE id = ?`, [challengeId], (err, challenge) => {
            if (challenge && challenge.rarity === 'troll' && challenge.reward < 0) {
                // Немедленно выполняем пакость - списываем деньги у цели
                const stolenAmount = Math.abs(challenge.reward);
                
                // Списываем у цели
                db.run(`UPDATE teams SET balance = balance - ? WHERE id = ?`, [stolenAmount, targetTeamId]);
                db.run(`INSERT INTO transactions (team_id, amount, type, description) VALUES (?, ?, ?, ?)`,
                    [targetTeamId, -stolenAmount, 'mischief_stolen', `Пакость: украдено командой ${req.session.user.team_name}`]);

                // Начисляем себе
                db.run(`UPDATE teams SET balance = balance + ? WHERE id = ?`, [stolenAmount, userTeamId]);
                db.run(`INSERT INTO transactions (team_id, amount, type, description) VALUES (?, ?, ?, ?)`,
                    [userTeamId, stolenAmount, 'mischief_gained', `Пакость: украдено у команды ${targetTeamId}`]);

                // Помечаем задание выполненным
                db.run(`UPDATE user_challenges SET status = 'completed' WHERE user_id = ? AND challenge_id = ?`, 
                    [userId, challengeId]);

                // Получаем обновленные балансы
                db.get(`SELECT balance FROM teams WHERE id = ?`, [userTeamId], (err, userTeam) => {
                    db.get(`SELECT name FROM teams WHERE id = ?`, [targetTeamId], (err, targetTeam) => {
                        res.json({ 
                            success: true, 
                            message: `Пакость выполнена! Украдено ${stolenAmount} руб у команды ${targetTeam.name}`,
                            newBalance: userTeam.balance
                        });
                    });
                });
            } else {
                res.json({ success: true });
            }
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'Login and password required' });
    }

    db.get(`SELECT users.*, teams.name as team_name, teams.id as team_id 
            FROM users 
            LEFT JOIN teams ON users.team_id = teams.id 
            WHERE users.login = ?`, 
        [login], (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful:', { 
            login: user.login, 
            role: user.role, 
            team_id: user.team_id, 
            team_name: user.team_name 
        });

        req.session.user = {
            id: user.id,
            login: user.login,
            role: user.role,
            team_id: user.team_id,
            team_name: user.team_name
        };

        res.json({ 
            success: true, 
            user: req.session.user
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout error' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/challenges/available', (req, res) => {
    const userId = req.session.user.id;

    db.get(`SELECT * FROM user_challenges WHERE user_id = ? AND status IN ('active', 'pending')`, 
        [userId], (err, activeChallenge) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (activeChallenge) {
            return res.json({ hasActiveChallenge: true, activeChallenge });
        }

        getAvailableChallengesCount(userId, (err, availableCount, totalCount) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            let excludeCondition = '';
            
            if (availableCount > 6) {
                // ИСКЛЮЧАЕМ ТОЛЬКО НЕ-ПАКОСТИ из used_challenges
                db.all(`SELECT uc.challenge_id, c.rarity 
                        FROM used_challenges uc 
                        JOIN challenges c ON uc.challenge_id = c.id 
                        WHERE uc.user_id = ? AND uc.replaced = 0 AND c.rarity != 'troll'`, 
                    [userId], (err, usedNonTrollChallenges) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    const usedNonTrollIds = usedNonTrollChallenges.map(uc => uc.challenge_id);
                    if (usedNonTrollIds.length > 0) {
                        excludeCondition = `AND id NOT IN (${usedNonTrollIds.join(',')})`;
                    }

                    generateChallengesForUser(userId, excludeCondition, res);
                });
            } else {
                db.run(`UPDATE used_challenges SET replaced = 1 WHERE user_id = ?`, [userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    generateChallengesForUser(userId, '', res);
                });
            }
        });
    });
});

function generateChallengesForUser(userId, excludeCondition, res) {
    db.all(`SELECT key, value FROM settings WHERE key LIKE '%probability'`, (err, settings) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const probabilities = {};
        settings.forEach(setting => {
            probabilities[setting.key] = parseInt(setting.value);
        });

        db.all(`SELECT * FROM challenges WHERE is_active = 1 ${excludeCondition}`, 
            (err, allChallenges) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const selectedChallenges = generateChallengeSet(allChallenges, probabilities);
            
            // НЕ ЗАПИСЫВАЕМ ПАКОСТИ в used_challenges (они могут выпадать повторно)
            const nonTrollChallenges = selectedChallenges.filter(challenge => challenge.rarity !== 'troll');
            
            if (nonTrollChallenges.length > 0) {
                const stmt = db.prepare(`INSERT INTO used_challenges (user_id, challenge_id) VALUES (?, ?)`);
                nonTrollChallenges.forEach(challenge => {
                    stmt.run([userId, challenge.id]);
                });
                stmt.finalize();
            }

            res.json({ hasActiveChallenge: false, challenges: selectedChallenges });
        });
    });
}

// Обновленная функция выбора задания - для пакости требует выбора цели
app.post('/api/challenges/select', (req, res) => {
    const { challengeId } = req.body;
    const userId = req.session.user.id;

    if (!challengeId) {
        return res.status(400).json({ error: 'Challenge ID required' });
    }

    db.get(`SELECT * FROM challenges WHERE id = ?`, [challengeId], (err, challenge) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (challenge.rarity === 'troll' && challenge.reward < 0) {
            // Для пакости возвращаем информацию что нужно выбрать цель
            return res.json({ 
                success: true, 
                requiresTarget: true,
                challengeId: challengeId,
                message: 'Выберите команду для пакости'
            });
        }

        // Для обычных заданий активируем сразу
        db.serialize(() => {
            db.run(`INSERT INTO user_challenges (user_id, challenge_id, status) VALUES (?, ?, 'active')`, 
                [userId, challengeId]);

            if (challenge && challenge.rarity === 'troll') {
                db.run(`UPDATE user_challenges SET status = 'completed' WHERE user_id = ? AND challenge_id = ?`, 
                    [userId, challengeId]);
            }
        });

        res.json({ success: true, requiresTarget: false });
    });
});

app.post('/api/challenges/replace', (req, res) => {
    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;
    const cost = 10000;

    console.log('Replace request:', { userId, teamId, cost });

    if (!teamId) {
        return res.status(400).json({ error: 'Команда не найдена для пользователя' });
    }

    db.get(`SELECT balance FROM teams WHERE id = ?`, [teamId], (err, team) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!team) {
            console.error('Team not found for ID:', teamId);
            return res.status(400).json({ error: 'Команда не найдена' });
        }
        
        console.log('Team balance:', team.balance);
        
        if (team.balance < cost) {
            return res.status(400).json({ error: 'Недостаточно средств для замены карт' });
        }

        db.run(`UPDATE used_challenges SET replaced = 1 WHERE user_id = ?`, [userId], function(err) {
            if (err) {
                console.error('Error updating used_challenges:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            db.run(`UPDATE teams SET balance = balance - ? WHERE id = ?`, [cost, teamId], function(err) {
                if (err) {
                    console.error('Error updating team balance:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                db.run(`INSERT INTO transactions (team_id, amount, type, description) VALUES (?, ?, ?, ?)`,
                    [teamId, -cost, 'card_replace', 'Замена карт заданий'], function(err) {
                    if (err) {
                        console.error('Error inserting transaction:', err);
                    }

                    res.json({ success: true, newBalance: team.balance - cost });
                });
            });
        });
    });
});

app.get('/api/cards/current', (req, res) => {
    const userId = req.session.user.id;

    db.all(`SELECT uc.*, c.title, c.description, c.rarity, c.reward 
            FROM used_challenges uc
            JOIN challenges c ON uc.challenge_id = c.id
            WHERE uc.user_id = ? AND uc.replaced = 0
            ORDER BY uc.created_at DESC LIMIT 3`, 
        [userId], (err, cards) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json({ cards: cards });
    });
});

app.post('/api/cards/generate', (req, res) => {
    const userId = req.session.user.id;

    db.all(`SELECT COUNT(*) as count FROM used_challenges WHERE user_id = ? AND replaced = 0`, 
        [userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (result.count > 0) {
            return res.status(400).json({ error: 'У вас уже есть активные карточки' });
        }

        getAvailableChallengesCount(userId, (err, availableCount, totalCount) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            let excludeCondition = '';
            
            if (availableCount > 6) {
                // ИСКЛЮЧАЕМ ТОЛЬКО НЕ-ПАКОСТИ из used_challenges
                db.all(`SELECT uc.challenge_id, c.rarity 
                        FROM used_challenges uc 
                        JOIN challenges c ON uc.challenge_id = c.id 
                        WHERE uc.user_id = ? AND uc.replaced = 0 AND c.rarity != 'troll'`, 
                    [userId], (err, usedNonTrollChallenges) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    const usedNonTrollIds = usedNonTrollChallenges.map(uc => uc.challenge_id);
                    if (usedNonTrollIds.length > 0) {
                        excludeCondition = `AND id NOT IN (${usedNonTrollIds.join(',')})`;
                    }

                    generateInitialChallenges(userId, excludeCondition, res);
                });
            } else {
                db.run(`UPDATE used_challenges SET replaced = 1 WHERE user_id = ?`, [userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    generateInitialChallenges(userId, '', res);
                });
            }
        });
    });
});

function generateInitialChallenges(userId, excludeCondition, res) {
    db.all(`SELECT key, value FROM settings WHERE key LIKE '%probability'`, (err, settings) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const probabilities = {};
        settings.forEach(setting => {
            probabilities[setting.key] = parseInt(setting.value);
        });

        db.all(`SELECT * FROM challenges WHERE is_active = 1 ${excludeCondition}`, 
            (err, allChallenges) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const selectedChallenges = generateChallengeSet(allChallenges, probabilities);
            
            // НЕ ЗАПИСЫВАЕМ ПАКОСТИ в used_challenges (они могут выпадать повторно)
            const nonTrollChallenges = selectedChallenges.filter(challenge => challenge.rarity !== 'troll');
            
            if (nonTrollChallenges.length > 0) {
                const stmt = db.prepare(`INSERT INTO used_challenges (user_id, challenge_id) VALUES (?, ?)`);
                nonTrollChallenges.forEach(challenge => {
                    stmt.run([userId, challenge.id]);
                });
                stmt.finalize();
            }

            res.json({ success: true, challenges: selectedChallenges });
        });
    });
}

app.get('/api/teams/my-team', (req, res) => {
    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;

    if (!teamId) {
        return res.status(400).json({ error: 'Команда не найдена для пользователя' });
    }

    db.get(`SELECT * FROM teams WHERE id = ?`, [teamId], (err, team) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (!team) {
            return res.status(400).json({ error: 'Команда не найдена' });
        }

        db.get(`SELECT uc.*, c.title, c.description, c.rarity, c.reward 
                FROM user_challenges uc 
                JOIN challenges c ON uc.challenge_id = c.id 
                WHERE uc.user_id = ? AND uc.status IN ('active', 'pending') 
                ORDER BY uc.created_at DESC LIMIT 1`, 
            [userId], (err, activeChallenge) => {
            
            if (err) return res.status(500).json({ error: 'Database error' });

            db.get(`SELECT COUNT(*) as cancel_count FROM user_challenges WHERE user_id = ? AND status = 'cancelled'`, 
                [userId], (err, result) => {
                
                res.json({
                    team: team,
                    activeChallenge: activeChallenge,
                    cancelCount: result ? result.cancel_count : 0
                });
            });
        });
    });
});

app.post('/api/teams/complete-challenge', (req, res) => {
    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;

    db.get(`SELECT uc.*, c.reward FROM user_challenges uc 
            JOIN challenges c ON uc.challenge_id = c.id 
            WHERE uc.user_id = ? AND uc.status = 'active'`, 
        [userId], (err, challenge) => {
        
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!challenge) return res.status(400).json({ error: 'No active challenge' });

        db.run(`UPDATE user_challenges SET status = 'pending' WHERE id = ?`, [challenge.id], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        });
    });
});

app.post('/api/teams/cancel-challenge', (req, res) => {
    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;

    db.get(`SELECT uc.*, c.reward FROM user_challenges uc 
            JOIN challenges c ON uc.challenge_id = c.id 
            WHERE uc.user_id = ? AND uc.status = 'active'`, 
        [userId], (err, challenge) => {
        
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!challenge) return res.status(400).json({ error: 'No active challenge' });

        db.get(`SELECT COUNT(*) as cancel_count FROM user_challenges WHERE user_id = ? AND status = 'cancelled'`, 
            [userId], (err, result) => {
            
            const cancelCount = result ? result.cancel_count : 0;
            let penalty = 0;

            if (cancelCount >= 3) {
                penalty = Math.round(challenge.reward * 0.2);
                db.run(`UPDATE teams SET balance = balance - ? WHERE id = ?`, [penalty, teamId]);
                db.run(`INSERT INTO transactions (team_id, amount, type, description) VALUES (?, ?, ?, ?)`,
                    [teamId, -penalty, 'cancel_penalty', 'Штраф за отмену задания']);
            }

            db.run(`UPDATE user_challenges SET status = 'cancelled' WHERE id = ?`, [challenge.id], function(err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ success: true, penaltyApplied: penalty > 0, penaltyAmount: penalty });
            });
        });
    });
});

app.get('/api/moderator/teams', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    db.all(`SELECT t.*, 
                   uc.status as challenge_status,
                   c.title as challenge_title,
                   c.reward as challenge_reward,
                   u.login as captain_login
            FROM teams t
            LEFT JOIN users u ON t.id = u.team_id AND u.role = 'captain'
            LEFT JOIN user_challenges uc ON u.id = uc.user_id AND uc.status IN ('active', 'pending')
            LEFT JOIN challenges c ON uc.challenge_id = c.id`, 
        (err, teams) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(teams);
    });
});

app.post('/api/moderator/update-team', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { teamId, balance, completed_challenges, challenge_status } = req.body;

    db.serialize(() => {
        if (balance !== undefined) {
            db.run(`UPDATE teams SET balance = ? WHERE id = ?`, [balance, teamId]);
        }
        
        if (completed_challenges !== undefined) {
            db.run(`UPDATE teams SET completed_challenges = ? WHERE id = ?`, [completed_challenges, teamId]);
        }

        if (challenge_status) {
            db.get(`SELECT id FROM users WHERE team_id = ? AND role = 'captain'`, [teamId], (err, user) => {
                if (user) {
                    db.run(`UPDATE user_challenges SET status = ? WHERE user_id = ? AND status IN ('active', 'pending')`, 
                        [challenge_status, user.id]);
                    
                    if (challenge_status === 'completed') {
                        db.get(`SELECT reward FROM user_challenges uc 
                               JOIN challenges c ON uc.challenge_id = c.id 
                               WHERE uc.user_id = ? AND uc.status = 'completed'`, 
                            [user.id], (err, challenge) => {
                            if (challenge) {
                                db.run(`UPDATE teams SET balance = balance + ?, completed_challenges = completed_challenges + 1 WHERE id = ?`, 
                                    [challenge.reward, teamId]);
                            }
                        });
                    }
                }
            });
        }
    });

    res.json({ success: true });
});

app.get('/api/moderator/probabilities', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    db.all(`SELECT key, value FROM settings WHERE key LIKE '%probability'`, (err, settings) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const probabilities = {};
        settings.forEach(setting => {
            const key = setting.key.replace('_probability', '');
            probabilities[key] = parseInt(setting.value);
        });

        res.json(probabilities);
    });
});

app.post('/api/moderator/probabilities', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { epic, rare, common, troll } = req.body;
    const total = epic + rare + common + troll;

    if (total !== 100) {
        return res.status(400).json({ error: 'Сумма вероятностей должна быть 100%' });
    }

    db.serialize(() => {
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [epic, 'epic_probability']);
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [rare, 'rare_probability']);
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [common, 'common_probability']);
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [troll, 'troll_probability']);
    });

    res.json({ success: true });
});

app.post('/api/moderator/reset-challenges', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    db.run(`DELETE FROM used_challenges`, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.get('/api/leaderboard', (req, res) => {
    db.all(`SELECT name, balance, completed_challenges FROM teams ORDER BY balance DESC, completed_challenges DESC`, 
        (err, teams) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(teams);
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
});