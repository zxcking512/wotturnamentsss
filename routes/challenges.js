module.exports = function(db) {
    const express = require('express');
    const router = express.Router();

    // Get available challenges for user
    router.get('/available', (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const userId = req.session.user.id;

        // Check if user already has active challenge
        db.get(`SELECT * FROM user_challenges WHERE user_id = ? AND status IN ('active', 'pending')`, 
            [userId], (err, activeChallenge) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (activeChallenge) {
                return res.json({ hasActiveChallenge: true, activeChallenge });
            }

            // Get probabilities
            db.all(`SELECT key, value FROM settings WHERE key LIKE '%probability'`, (err, settings) => {
                if (err) return res.status(500).json({ error: 'Database error' });

                const probabilities = {};
                settings.forEach(setting => {
                    probabilities[setting.key] = parseInt(setting.value);
                });

                // Get used challenges to exclude them
                db.all(`SELECT challenge_id FROM used_challenges WHERE user_id = ? AND replaced = 0`, 
                    [userId], (err, usedChallenges) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    const usedIds = usedChallenges.map(uc => uc.challenge_id);
                    let excludeCondition = '';
                    if (usedIds.length > 0) {
                        excludeCondition = `AND id NOT IN (${usedIds.join(',')})`;
                    }

                    // Get all active challenges
                    db.all(`SELECT * FROM challenges WHERE is_active = 1 ${excludeCondition}`, 
                        (err, allChallenges) => {
                        if (err) return res.status(500).json({ error: 'Database error' });

                        // Generate 3 random challenges based on probabilities
                        const selectedChallenges = generateChallengeSet(allChallenges, probabilities);
                        res.json({ hasActiveChallenge: false, challenges: selectedChallenges });
                    });
                });
            });
        });
    });

    // Select a challenge
    router.post('/select', (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const { challengeId } = req.body;
        const userId = req.session.user.id;
        const teamId = req.session.user.team_id;

        if (!challengeId) {
            return res.status(400).json({ error: 'Challenge ID required' });
        }

        // Start transaction
        db.serialize(() => {
            // Add to user_challenges
            db.run(`INSERT INTO user_challenges (user_id, challenge_id, status) VALUES (?, ?, 'active')`, 
                [userId, challengeId]);

            // Add to used_challenges
            db.run(`INSERT INTO used_challenges (user_id, challenge_id) VALUES (?, ?)`, 
                [userId, challengeId]);

            // If it's a troll challenge, apply immediately
            db.get(`SELECT * FROM challenges WHERE id = ?`, [challengeId], (err, challenge) => {
                if (challenge && challenge.rarity === 'troll') {
                    // For troll challenge, we'll handle the team selection separately
                    // Just mark it as completed immediately
                    db.run(`UPDATE user_challenges SET status = 'completed' WHERE user_id = ? AND challenge_id = ?`, 
                        [userId, challengeId]);
                }
            });
        });

        res.json({ success: true });
    });

    // Replace challenges
    router.post('/replace', (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const userId = req.session.user.id;
        const teamId = req.session.user.team_id;
        const cost = 10000;

        // Check balance
        db.get(`SELECT balance FROM teams WHERE id = ?`, [teamId], (err, team) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (team.balance < cost) {
                return res.status(400).json({ error: 'Недостаточно средств для замены карт' });
            }

            // Mark current used challenges as replaced
            db.run(`UPDATE used_challenges SET replaced = 1 WHERE user_id = ?`, [userId], function(err) {
                if (err) return res.status(500).json({ error: 'Database error' });

                // Deduct cost
                db.run(`UPDATE teams SET balance = balance - ? WHERE id = ?`, [cost, teamId]);
                db.run(`INSERT INTO transactions (team_id, amount, type, description) VALUES (?, ?, ?, ?)`,
                    [teamId, -cost, 'card_replace', 'Замена карт заданий']);

                res.json({ success: true, newBalance: team.balance - cost });
            });
        });
    });

    // Helper function to generate challenge set
    function generateChallengeSet(allChallenges, probabilities) {
        const challengesByRarity = {
            epic: allChallenges.filter(c => c.rarity === 'epic'),
            rare: allChallenges.filter(c => c.rarity === 'rare'),
            common: allChallenges.filter(c => c.rarity === 'common'),
            troll: allChallenges.filter(c => c.rarity === 'troll')
        };

        const selected = [];
        const usedIds = new Set();

        // Ensure no more than one epic and one troll
        const maxEpic = 1, maxTroll = 1;

        for (let i = 0; i < 3; i++) {
            let availableRarities = [];

            // Check limits
            const currentEpic = selected.filter(c => c.rarity === 'epic').length;
            const currentTroll = selected.filter(c => c.rarity === 'troll').length;

            if (currentEpic < maxEpic) availableRarities.push('epic');
            if (currentTroll < maxTroll) availableRarities.push('troll');
            availableRarities.push('rare', 'common');

            // Filter by available rarities and remove already selected challenges
            let availableChallenges = [];
            availableRarities.forEach(rarity => {
                availableChallenges = availableChallenges.concat(
                    challengesByRarity[rarity].filter(c => !usedIds.has(c.id))
                );
            });

            if (availableChallenges.length === 0) break;

            // Select random challenge
            const randomIndex = Math.floor(Math.random() * availableChallenges.length);
            const selectedChallenge = availableChallenges[randomIndex];
            
            selected.push(selectedChallenge);
            usedIds.add(selectedChallenge.id);
        }

        return selected;
    }

    return router;
};