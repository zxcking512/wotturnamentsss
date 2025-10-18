const API_BASE = 'http://localhost:3000/api';

// Общий API клиент
const api = {
  // Auth methods
  async login(login, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  },

  // Challenges methods
  async getAvailableChallenges() {
    const response = await fetch(`${API_BASE}/challenges/available`, {
      credentials: 'include',
    });
    return await response.json();
  },

  async selectChallenge(challengeId) {
    const response = await fetch(`${API_BASE}/challenges/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ challengeId }),
    });
    return await response.json();
  },

  // НОВЫЙ МЕТОД: Выбор цели для пакости
  async selectMischiefTarget(challengeId, targetTeamId) {
    const response = await fetch(`${API_BASE}/challenges/select-mischief-target`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ challengeId, targetTeamId }),
    });
    return await response.json();
  },

  async replaceChallenges() {
    const response = await fetch(`${API_BASE}/challenges/replace`, {
      method: 'POST',
      credentials: 'include',
    });
    return await response.json();
  },

  // Cards methods
  async generateCards() {
    const response = await fetch(`${API_BASE}/cards/generate`, {
      method: 'POST',
      credentials: 'include',
    });
    return await response.json();
  },

  async getCurrentCards() {
    const response = await fetch(`${API_BASE}/cards/current`, {
      credentials: 'include',
    });
    return await response.json();
  },

  // Teams methods
  async getMyTeam() {
    const response = await fetch(`${API_BASE}/teams/my-team`, {
      credentials: 'include',
    });
    return await response.json();
  },

  // НОВЫЙ МЕТОД: Получить список команд для пакости
  async getTeamsForMischief() {
    const response = await fetch(`${API_BASE}/teams/for-mischief`, {
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
  },

  // Leaderboard methods
  async getLeaderboard() {
    const response = await fetch(`${API_BASE}/leaderboard`);
    return await response.json();
  },

  // Moderator methods
  async getTeams() {
    const response = await fetch(`${API_BASE}/moderator/teams`, {
      credentials: 'include',
    });
    return await response.json();
  },

  async updateTeam(teamId, updates) {
    const response = await fetch(`${API_BASE}/moderator/update-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

// Named exports для обратной совместимости
export const authAPI = {
  login: api.login,
  logout: api.logout,
  check: api.checkAuth
};

export const challengesAPI = {
  getAvailable: api.getAvailableChallenges,
  select: api.selectChallenge,
  selectMischiefTarget: api.selectMischiefTarget,
  replace: api.replaceChallenges
};

export const teamsAPI = {
  getMyTeam: api.getMyTeam,
  getForMischief: api.getTeamsForMischief,
  completeChallenge: api.completeChallenge,
  cancelChallenge: api.cancelChallenge
};

export const cardsAPI = {
  getCurrent: api.getCurrentCards,
  generate: api.generateCards
};

export const leaderboardAPI = {
  get: api.getLeaderboard
};

export const moderatorAPI = {
  getTeams: api.getTeams,
  updateTeam: api.updateTeam,
  getProbabilities: api.getProbabilities,
  updateProbabilities: api.updateProbabilities,
  resetChallenges: api.resetChallenges
};

// Default export
export default api;