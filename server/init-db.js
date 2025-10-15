const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

// Delete old database file
const fs = require('fs');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Old database deleted');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err);
    } else {
        console.log('Creating new SQLite database...');
        initDB(db);
    }
});

function initDB(db) {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'captain',
            team_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Teams table
        db.run(`CREATE TABLE teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            balance INTEGER DEFAULT 0,
            completed_challenges INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Challenges table
        db.run(`CREATE TABLE challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            rarity TEXT NOT NULL,
            reward INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // User challenges table
        db.run(`CREATE TABLE user_challenges (
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
        db.run(`CREATE TABLE used_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            replaced BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        )`);

        // Transactions table
        db.run(`CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id)
        )`);

        // Settings table
        db.run(`CREATE TABLE settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )`);

        // Insert default probabilities
        db.run(`INSERT INTO settings (key, value) VALUES 
            ('epic_probability', '10'),
            ('rare_probability', '20'),
            ('common_probability', '65'),
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

        const insertChallenge = db.prepare(`INSERT INTO challenges (title, description, rarity, reward) VALUES (?, ?, ?, ?)`);
        sampleChallenges.forEach(challenge => {
            insertChallenge.run([challenge.title, challenge.description, challenge.rarity, challenge.reward]);
        });
        insertChallenge.finalize();

        // Create default moderator account
        const moderatorPassword = bcrypt.hashSync('moderator123', 10);
        db.run(`INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)`, 
            ['moderator', moderatorPassword, 'moderator']);

        // Create sample team and captain
        db.run(`INSERT INTO teams (name, balance) VALUES (?, ?)`, ['StreamerTeam1', 100000]);
        const captainPassword = bcrypt.hashSync('captain123', 10);
        db.run(`INSERT INTO users (login, password_hash, role, team_id) VALUES (?, ?, ?, ?)`, 
            ['captain1', captainPassword, 'captain', 1]);

        console.log('Database initialized successfully with test data!');
        console.log('Moderator login: moderator / moderator123');
        console.log('Captain login: captain1 / captain123');
        
        db.close();
    });
}