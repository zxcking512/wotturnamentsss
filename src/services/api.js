const API_BASE = 'http://localhost:3000/api';

// Auth API
export const authAPI = {
    async login(login, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ login, password }),
        });
        return await response.json();
    },

    async logout() {
        const response = await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        return await response.json();
    },

    async checkAuth() {
        const response = await fetch(`${API_BASE}/auth/check`, {
            credentials: 'include',
        });
        return await response.json();
    }
};

// Challenges API
export const challengesAPI = {
    async getAvailableChallenges() {
        const response = await fetch(`${API_BASE}/challenges/available`, {
            credentials: 'include',
        });
        return await response.json();
    },

    async selectChallenge(challengeId) {
        const response = await fetch(`${API_BASE}/challenges/select`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ challengeId }),
        });
        return await response.json();
    },

    async replaceChallenges() {
        const response = await fetch(`${API_BASE}/challenges/replace`, {
            method: 'POST',
            credentials: 'include',
        });
        return await response.json();
    }
};

// Teams API
export const teamsAPI = {
    async getMyTeam() {
        const response = await fetch(`${API_BASE}/teams/my-team`, {
            credentials: 'include',
        });
        return await response.json();
    },

    async completeChallenge() {
        const response = await fetch(`${API_BASE}/teams/complete-challenge`, {
            method: 'POST',
            credentials: 'include',
        });
        return await response.json();
    },

    async cancelChallenge() {
        const response = await fetch(`${API_BASE}/teams/cancel-challenge`, {
            method: 'POST',
            credentials: 'include',
        });
        return await response.json();
    }
};

// Leaderboard API
export const leaderboardAPI = {
    async getLeaderboard() {
        const response = await fetch(`${API_BASE}/leaderboard`);
        return await response.json();
    }
};

// Moderator API
export const moderatorAPI = {
    async getTeams() {
        const response = await fetch(`${API_BASE}/moderator/teams`, {
            credentials: 'include',
        });
        return await response.json();
    },

    async updateTeam(teamId, updates) {
        const response = await fetch(`${API_BASE}/moderator/update-team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ teamId, ...updates }),
        });
        return await response.json();
    },

    async getProbabilities() {
        const response = await fetch(`${API_BASE}/moderator/probabilities`, {
            credentials: 'include',
        });
        return await response.json();
    },

    async updateProbabilities(probabilities) {
        const response = await fetch(`${API_BASE}/moderator/probabilities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(probabilities),
        });
        return await response.json();
    },

    async resetChallenges() {
        const response = await fetch(`${API_BASE}/moderator/reset-challenges`, {
            method: 'POST',
            credentials: 'include',
        });
        return await response.json();
    }
};