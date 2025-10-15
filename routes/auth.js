module.exports = function(db, bcrypt) {
    const express = require('express');
    const router = express.Router();

    // Login
    router.post('/login', (req, res) => {
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
                user: req.session.user,
                redirect: user.role === 'moderator' ? '/moderator' : '/challenges'
            });
        });
    });

    // Logout
    router.post('/logout', (req, res) => {
        req.session.destroy();
        res.json({ success: true });
    });

    // Check session
    router.get('/check', (req, res) => {
        if (req.session.user) {
            res.json({ loggedIn: true, user: req.session.user });
        } else {
            res.json({ loggedIn: false });
        }
    });

    return router;
};