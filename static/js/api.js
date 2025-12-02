const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'An error occurred');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getHabits() {
        return this.request('/habits');
    },

    async createHabit(name, description = '') {
        return this.request('/habits', {
            method: 'POST',
            body: { name, description },
        });
    },

    async getHabit(habitId) {
        return this.request(`/habits/${habitId}`);
    },

    async updateHabit(habitId, data) {
        return this.request(`/habits/${habitId}`, {
            method: 'PUT',
            body: data,
        });
    },

    async deleteHabit(habitId) {
        return this.request(`/habits/${habitId}`, {
            method: 'DELETE',
        });
    },

    async toggleHabit(habitId, date = null) {
        return this.request(`/habits/${habitId}/toggle`, {
            method: 'POST',
            body: date ? { date } : {},
        });
    },

    async getHabitHistory(habitId, days = 30) {
        return this.request(`/habits/${habitId}/history?days=${days}`);
    },

    async getDashboard() {
        return this.request('/dashboard');
    },

    async getReports() {
        return this.request('/reports');
    },

    async generateReport() {
        return this.request('/reports/generate', {
            method: 'POST',
        });
    },

    async getLatestReport() {
        return this.request('/reports/latest');
    },
};
