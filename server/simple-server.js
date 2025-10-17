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
const PORT = process.env.PORT || 3000;

// CORS для React dev server
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Middleware
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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Database initialization
const db = new sqlite3.Database('./server/database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDB(db);
    }
});

// Initialize database tables
function initDB(db) {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'captain',
            team_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Teams table
        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            balance INTEGER DEFAULT 0,
            completed_challenges INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Challenges table
        db.run(`CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            rarity TEXT NOT NULL,
            reward INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // User challenges table
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

        // Used challenges table
        db.run(`CREATE TABLE IF NOT EXISTS used_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            replaced BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        )`);

        // Transactions table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id)
        )`);

        // Settings table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )`);

        // Insert default probabilities
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
            ('epic_probability', '10'),
            ('rare_probability', '25'),
            ('common_probability', '60'),
            ('troll_probability', '5')
        `);

        // Insert sample challenges
        const sampleChallenges = [
            {title: 'Эпическое безумство 1', description: 'Выиграть 5 боев подряд с уроном выше 3000', rarity: 'epic', reward: 50000},
            {title: 'Эпическое безумство 2', description: 'Уничтожить 3 танка за 1 минуту боя', rarity: 'epic', reward: 50000},
            {title: 'Дерзкий вызов 1', description: 'Выиграть бой с уроном 4000+', rarity: 'rare', reward: 25000},
            {title: 'Дерзкий вызов 2', description: 'Уничтожить 5 танков за бой', rarity: 'rare', reward: 25000},
            {title: 'Простая шалость 1', description: 'Выиграть 3 боя', rarity: 'common', reward: 5000},
            {title: 'Простая шалость 2', description: 'Нанести 2000 урона за бой', rarity: 'common', reward: 5000},
            {title: 'Пакость', description: 'Забрать 10000 рублей у другой команды', rarity: 'troll', reward: -10000}
        ];

        const insertChallenge = db.prepare(`INSERT OR IGNORE INTO challenges (title, description, rarity, reward) VALUES (?, ?, ?, ?)`);
        sampleChallenges.forEach(challenge => {
            insertChallenge.run([challenge.title, challenge.description, challenge.rarity, challenge.reward]);
        });
        insertChallenge.finalize();

        // Create default moderator account
        const moderatorPassword = bcrypt.hashSync('moderator123', 10);
        db.run(`INSERT OR IGNORE INTO users (login, password_hash, role) VALUES (?, ?, ?)`, 
            ['moderator', moderatorPassword, 'moderator']);

        // Create sample team and captain
        db.run(`INSERT OR IGNORE INTO teams (name, balance) VALUES (?, ?)`, ['StreamerTeam1', 100000]);
        const captainPassword = bcrypt.hashSync('captain123', 10);
        db.run(`INSERT OR IGNORE INTO users (login, password_hash, role, team_id) VALUES (?, ?, ?, ?)`, 
            ['captain1', captainPassword, 'captain', 1]);

        console.log('Database initialized successfully');
        console.log('Test accounts:');
        console.log('Moderator: moderator / moderator123');
        console.log('Captain: captain1 / captain123');
    });
}

// Auth routes
app.post('/api/auth/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'Login and password required' });
    }

    db.get('SELECT users.*, teams.name as team_name FROM users LEFT JOIN teams ON users.team_id = teams.id WHERE login = ?', 
        [login], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Challenges routes
app.get('/api/challenges/available', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    const userId = req.session.user.id;

    db.get(`SELECT * FROM user_challenges WHERE user_id = ? AND status IN ('active', 'pending')`, 
        [userId], (err, activeChallenge) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (activeChallenge) {
            return res.json({ hasActiveChallenge: true, activeChallenge });
        }

        db.all(`SELECT key, value FROM settings WHERE key LIKE '%probability'`, (err, settings) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const probabilities = {};
            settings.forEach(setting => {
                probabilities[setting.key] = parseInt(setting.value);
            });

            db.all(`SELECT challenge_id FROM used_challenges WHERE user_id = ? AND replaced = 0`, 
                [userId], (err, usedChallenges) => {
                if (err) return res.status(500).json({ error: 'Database error' });

                const usedIds = usedChallenges.map(uc => uc.challenge_id);
                let excludeCondition = '';
                if (usedIds.length > 0) {
                    excludeCondition = `AND id NOT IN (${usedIds.join(',')})`;
                }

                db.all(`SELECT * FROM challenges WHERE is_active = 1 ${excludeCondition}`, 
                    (err, allChallenges) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    const selectedChallenges = generateChallengeSet(allChallenges, probabilities);
                    res.json({ hasActiveChallenge: false, challenges: selectedChallenges });
                });
            });
        });
    });
});

app.post('/api/challenges/select', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    const { challengeId } = req.body;
    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;

    if (!challengeId) {
        return res.status(400).json({ error: 'Challenge ID required' });
    }

    db.serialize(() => {
        db.run(`INSERT INTO user_challenges (user_id, challenge_id, status) VALUES (?, ?, 'active')`, 
            [userId, challengeId]);

        db.run(`INSERT INTO used_challenges (user_id, challenge_id) VALUES (?, ?)`, 
            [userId, challengeId]);

        db.get(`SELECT * FROM challenges WHERE id = ?`, [challengeId], (err, challenge) => {
            if (challenge && challenge.rarity === 'troll') {
                db.run(`UPDATE user_challenges SET status = 'completed' WHERE user_id = ? AND challenge_id = ?`, 
                    [userId, challengeId]);
            }
        });
    });

    res.json({ success: true });
});

app.post('/api/challenges/replace', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;
    const cost = 10000;

    db.get(`SELECT balance FROM teams WHERE id = ?`, [teamId], (err, team) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (team.balance < cost) {
            return res.status(400).json({ error: 'Недостаточно средств для замены карт' });
        }

        db.run(`UPDATE used_challenges SET replaced = 1 WHERE user_id = ?`, [userId], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });

            db.run(`UPDATE teams SET balance = balance - ? WHERE id = ?`, [cost, teamId]);
            db.run(`INSERT INTO transactions (team_id, amount, type, description) VALUES (?, ?, ?, ?)`,
                [teamId, -cost, 'card_replace', 'Замена карт заданий']);

            res.json({ success: true, newBalance: team.balance - cost });
        });
    });
});

// Teams routes
app.get('/api/teams/my-team', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;

    db.get(`SELECT * FROM teams WHERE id = ?`, [teamId], (err, team) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        db.get(`SELECT uc.*, c.title, c.description, c.rarity, c.reward 
                FROM user_challenges uc 
                JOIN challenges c ON uc.challenge_id = c.id 
                WHERE uc.user_id = ? AND uc.status IN ('active', 'pending') 
                ORDER BY uc.created_at DESC LIMIT 1`, 
            [userId], (err, activeChallenge) => {
            
            if (err) return res.status(500).json({ error: 'Database error' });

            // Get cancel count
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }

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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    const userId = req.session.user.id;
    const teamId = req.session.user.team_id;

    db.get(`SELECT uc.*, c.reward FROM user_challenges uc 
            JOIN challenges c ON uc.challenge_id = c.id 
            WHERE uc.user_id = ? AND uc.status = 'active'`, 
        [userId], (err, challenge) => {
        
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!challenge) return res.status(400).json({ error: 'No active challenge' });

        // Get cancel count to check if penalty applies
        db.get(`SELECT COUNT(*) as cancel_count FROM user_challenges WHERE user_id = ? AND status = 'cancelled'`, 
            [userId], (err, result) => {
            
            const cancelCount = result ? result.cancel_count : 0;
            let penalty = 0;

            if (cancelCount >= 3) {
                // Apply 20% penalty
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

// Leaderboard routes
app.get('/api/leaderboard', (req, res) => {
    db.all(`SELECT name, balance, completed_challenges FROM teams ORDER BY balance DESC`, (err, teams) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(teams);
    });
});

// Moderator routes
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
            // Find user for this team
            db.get(`SELECT id FROM users WHERE team_id = ? AND role = 'captain'`, [teamId], (err, user) => {
                if (user) {
                    db.run(`UPDATE user_challenges SET status = ? WHERE user_id = ? AND status IN ('active', 'pending')`, 
                        [challenge_status, user.id]);
                }
            });
        }
    });

    res.json({ success: true });
});

// Вероятности выпадения
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

    db.serialize(() => {
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [epic, 'epic_probability']);
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [rare, 'rare_probability']);
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [common, 'common_probability']);
        db.run(`UPDATE settings SET value = ? WHERE key = ?`, [troll, 'troll_probability']);
    });

    res.json({ success: true });
});

// Сброс истории заданий
app.post('/api/moderator/reset-challenges', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    db.run(`DELETE FROM used_challenges`, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// Serve HTML for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Helper function
function generateChallengeSet(allChallenges, probabilities) {
    const challengesByRarity = {
        epic: allChallenges.filter(c => c.rarity === 'epic'),
        rare: allChallenges.filter(c => c.rarity === 'rare'),
        common: allChallenges.filter(c => c.rarity === 'common'),
        troll: allChallenges.filter(c => c.rarity === 'troll')
    };

    const selected = [];
    const usedIds = new Set();

    const maxEpic = 1, maxTroll = 1;

    for (let i = 0; i < 3; i++) {
        let availableRarities = [];

        const currentEpic = selected.filter(c => c.rarity === 'epic').length;
        const currentTroll = selected.filter(c => c.rarity === 'troll').length;

        if (currentEpic < maxEpic) availableRarities.push('epic');
        if (currentTroll < maxTroll) availableRarities.push('troll');
        availableRarities.push('rare', 'common');

        let availableChallenges = [];
        availableRarities.forEach(rarity => {
            availableChallenges = availableChallenges.concat(
                challengesByRarity[rarity].filter(c => !usedIds.has(c.id))
            );
        });

        if (availableChallenges.length === 0) break;

        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        const selectedChallenge = availableChallenges[randomIndex];
        
        selected.push(selectedChallenge);
        usedIds.add(selectedChallenge.id);
    }

    return selected;
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});