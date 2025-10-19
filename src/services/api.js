// src/services/api.js
const API_BASE_URL = 'http://192.168.0.52:3001/api'; 

// Общий API клиент
const api = {
  // Auth methods
  async login(login, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ login, password }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login API error:', error);
      throw new Error(`Ошибка сети: ${error.message}`);
    }
  },

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return await response.json();
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  },

  async checkAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Check auth API error:', error);
      throw new Error(`Ошибка проверки авторизации: ${error.message}`);
    }
  },

  // Challenges methods
  async getAvailableChallenges() {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/available`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get challenges API error:', error);
      throw new Error(`Ошибка загрузки заданий: ${error.message}`);
    }
  },

  async selectChallenge(challengeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/select`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ challengeId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Select challenge API error:', error);
      throw new Error(`Ошибка выбора задания: ${error.message}`);
    }
  },

  // НОВЫЙ МЕТОД: Выбор цели для пакости
  async selectMischiefTarget(challengeId, targetTeamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/select-mischief-target`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ challengeId, targetTeamId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Select mischief target API error:', error);
      throw new Error(`Ошибка выбора цели: ${error.message}`);
    }
  },

  async replaceChallenges() {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/replace`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Replace challenges API error:', error);
      throw new Error(`Ошибка замены карточек: ${error.message}`);
    }
  },

  // Cards methods
  async generateCards() {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/generate`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Generate cards API error:', error);
      throw new Error(`Ошибка генерации карточек: ${error.message}`);
    }
  },

  async getCurrentCards() {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/current`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get current cards API error:', error);
      throw new Error(`Ошибка загрузки карточек: ${error.message}`);
    }
  },

  // Teams methods
  async getMyTeam() {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/my-team`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get my team API error:', error);
      throw new Error(`Ошибка загрузки данных команды: ${error.message}`);
    }
  },

  // НОВЫЙ МЕТОД: Получить список команд для пакости
  async getTeamsForMischief() {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/for-mischief`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get teams for mischief API error:', error);
      throw new Error(`Ошибка загрузки списка команд: ${error.message}`);
    }
  },

  async completeChallenge() {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/complete-challenge`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Complete challenge API error:', error);
      throw new Error(`Ошибка завершения задания: ${error.message}`);
    }
  },

  async cancelChallenge() {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/cancel-challenge`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Cancel challenge API error:', error);
      throw new Error(`Ошибка отмены задания: ${error.message}`);
    }
  },

  // Leaderboard methods
  async getLeaderboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get leaderboard API error:', error);
      throw new Error(`Ошибка загрузки таблицы лидеров: ${error.message}`);
    }
  },

  // Moderator methods
  async getTeams() {
    try {
      const response = await fetch(`${API_BASE_URL}/moderator/teams`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get teams API error:', error);
      throw new Error(`Ошибка загрузки команд: ${error.message}`);
    }
  },

  async updateTeam(teamId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/moderator/update-team`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ teamId, ...updates }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update team API error:', error);
      throw new Error(`Ошибка обновления команды: ${error.message}`);
    }
  },

  async getProbabilities() {
    try {
      const response = await fetch(`${API_BASE_URL}/moderator/probabilities`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get probabilities API error:', error);
      throw new Error(`Ошибка загрузки вероятностей: ${error.message}`);
    }
  },

  async updateProbabilities(probabilities) {
    try {
      const response = await fetch(`${API_BASE_URL}/moderator/probabilities`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(probabilities),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update probabilities API error:', error);
      throw new Error(`Ошибка обновления вероятностей: ${error.message}`);
    }
  },

  async resetChallenges() {
    try {
      const response = await fetch(`${API_BASE_URL}/moderator/reset-challenges`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Reset challenges API error:', error);
      throw new Error(`Ошибка сброса заданий: ${error.message}`);
    }
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