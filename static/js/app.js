class HabitApp {
    constructor() {
        this.habits = [];
        this.editingHabitId = null;
        this.init();
    }

    async init() {
        this.initTheme();
        this.bindEvents();
        await this.loadDashboard();
        await this.loadReports();
    }

    initTheme() {
        const savedTheme = Utils.getStoredTheme();
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    bindEvents() {
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('addHabitBtn').addEventListener('click', () => this.openHabitModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('habitForm').addEventListener('submit', (e) => this.handleHabitSubmit(e));
        document.getElementById('generateReportBtn').addEventListener('click', () => this.generateReport());
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeHistoryModal());

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.closeHabitModal();
                this.closeHistoryModal();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeHabitModal();
                this.closeHistoryModal();
            }
        });
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        Utils.setStoredTheme(newTheme);
    }

    async loadDashboard() {
        try {
            const data = await API.getDashboard();
            this.updateDashboard(data);
            this.habits = data.habits;
            this.renderHabits();
        } catch (error) {
            this.showToast('Failed to load dashboard', 'error');
        }
    }

    updateDashboard(data) {
        const scoreEl = document.getElementById('overallScore');
        Utils.animateValue(scoreEl, 0, Math.round(data.overall_score), 1000);

        const healthBadge = document.getElementById('overallHealth');
        healthBadge.className = `health-badge ${Utils.getHealthClass(data.overall_health.status)}`;
        healthBadge.innerHTML = `
            <span class="health-icon">${data.overall_health.icon}</span>
            <span class="health-text">${Utils.getHealthLabel(data.overall_health.status)}</span>
        `;

        document.getElementById('totalHabits').textContent = data.total_habits;
        document.getElementById('todayCompletions').textContent = data.today_completions;
        document.getElementById('currentDate').textContent = Utils.formatDateShort(data.date);
    }

    renderHabits() {
        const grid = document.getElementById('habitsGrid');
        
        if (this.habits.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No habits yet</h3>
                    <p>Start building better habits by adding your first one!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.habits.map((habitData, index) => this.createHabitCard(habitData, index)).join('');

        grid.querySelectorAll('.habit-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = parseInt(e.currentTarget.dataset.habitId);
                this.toggleHabit(habitId);
            });
        });

        grid.querySelectorAll('.edit-habit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = parseInt(e.currentTarget.dataset.habitId);
                this.openEditModal(habitId);
            });
        });

        grid.querySelectorAll('.delete-habit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = parseInt(e.currentTarget.dataset.habitId);
                this.deleteHabit(habitId);
            });
        });

        grid.querySelectorAll('.view-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = parseInt(e.currentTarget.dataset.habitId);
                this.showHistory(habitId);
            });
        });
    }

    createHabitCard(habitData, index) {
        const { habit, current_streak, longest_streak, consistency_score, health, total_completions } = habitData;
        const isCompletedToday = this.isCompletedToday(habitData);
        const streakClass = Utils.getStreakBadgeClass(current_streak);

        return `
            <div class="habit-card" style="animation-delay: ${index * 0.05}s">
                <div class="habit-header">
                    <div class="habit-info">
                        <h3>${Utils.escapeHtml(habit.name)}</h3>
                        ${habit.description ? `<p>${Utils.escapeHtml(habit.description)}</p>` : ''}
                    </div>
                    <div class="habit-actions">
                        <button class="view-history" data-habit-id="${habit.id}" title="View History">📅</button>
                        <button class="edit-habit" data-habit-id="${habit.id}" title="Edit">✏️</button>
                        <button class="delete-habit" data-habit-id="${habit.id}" title="Delete">🗑️</button>
                    </div>
                </div>

                <div class="habit-stats">
                    <div class="habit-stat">
                        <span class="habit-stat-value">${current_streak}</span>
                        <span class="habit-stat-label">Current Streak</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-value">${longest_streak}</span>
                        <span class="habit-stat-label">Best Streak</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-value">${consistency_score}%</span>
                        <span class="habit-stat-label">Consistency</span>
                    </div>
                </div>

                <div class="habit-health ${Utils.getHealthClass(health.status)}">
                    <div class="health-info">
                        <span>${health.icon}</span>
                        <span>${Utils.getHealthLabel(health.status)}</span>
                    </div>
                    ${current_streak > 0 ? `
                        <span class="streak-badge ${streakClass}">
                            <span class="streak-fire">🔥</span> ${current_streak} day${current_streak > 1 ? 's' : ''}
                        </span>
                    ` : ''}
                </div>

                <button class="habit-toggle ${isCompletedToday ? 'completed' : 'not-completed'}" data-habit-id="${habit.id}">
                    ${isCompletedToday ? '✓ Completed Today' : 'Mark as Complete'}
                </button>
            </div>
        `;
    }

    isCompletedToday(habitData) {
        const today = Utils.getTodayISO();
        return habitData.habit && habitData.current_streak > 0;
    }

    async toggleHabit(habitId) {
        try {
            const result = await API.toggleHabit(habitId);
            
            const habitIndex = this.habits.findIndex(h => h.habit.id === habitId);
            if (habitIndex !== -1) {
                this.habits[habitIndex] = result.stats;
            }
            
            this.renderHabits();
            await this.loadDashboard();
            
            if (result.completed) {
                this.showToast('Habit completed! Keep it up! 🎉', 'success');
            } else {
                this.showToast('Habit marked as incomplete', 'success');
            }
        } catch (error) {
            this.showToast('Failed to update habit', 'error');
        }
    }

    openHabitModal() {
        this.editingHabitId = null;
        document.getElementById('modalTitle').textContent = 'Add New Habit';
        document.getElementById('habitName').value = '';
        document.getElementById('habitDescription').value = '';
        document.getElementById('habitModal').classList.add('active');
        document.getElementById('habitName').focus();
    }

    openEditModal(habitId) {
        const habitData = this.habits.find(h => h.habit.id === habitId);
        if (!habitData) return;

        this.editingHabitId = habitId;
        document.getElementById('modalTitle').textContent = 'Edit Habit';
        document.getElementById('habitName').value = habitData.habit.name;
        document.getElementById('habitDescription').value = habitData.habit.description || '';
        document.getElementById('habitModal').classList.add('active');
        document.getElementById('habitName').focus();
    }

    closeHabitModal() {
        document.getElementById('habitModal').classList.remove('active');
        this.editingHabitId = null;
    }

    async handleHabitSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDescription').value.trim();

        if (!name) {
            this.showToast('Please enter a habit name', 'error');
            return;
        }

        try {
            if (this.editingHabitId) {
                await API.updateHabit(this.editingHabitId, { name, description });
                this.showToast('Habit updated successfully!', 'success');
            } else {
                await API.createHabit(name, description);
                this.showToast('Habit created successfully!', 'success');
            }

            this.closeHabitModal();
            await this.loadDashboard();
        } catch (error) {
            this.showToast('Failed to save habit', 'error');
        }
    }

    async deleteHabit(habitId) {
        if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            return;
        }

        try {
            await API.deleteHabit(habitId);
            this.showToast('Habit deleted successfully', 'success');
            await this.loadDashboard();
        } catch (error) {
            this.showToast('Failed to delete habit', 'error');
        }
    }

    async showHistory(habitId) {
        try {
            const habitData = this.habits.find(h => h.habit.id === habitId);
            if (!habitData) return;

            const history = await API.getHabitHistory(habitId, 30);
            
            document.getElementById('historyModalTitle').textContent = `${habitData.habit.name} - Last 30 Days`;
            
            const calendar = document.getElementById('historyCalendar');
            calendar.innerHTML = history.map(day => {
                const isToday = Utils.isToday(day.date);
                const dayNum = new Date(day.date).getDate();
                return `
                    <div class="calendar-day ${day.completed ? 'completed' : 'missed'} ${isToday ? 'today' : ''}" 
                         title="${Utils.formatDateFull(day.date)}">
                        ${dayNum}
                    </div>
                `;
            }).join('');

            document.getElementById('historyModal').classList.add('active');
        } catch (error) {
            this.showToast('Failed to load history', 'error');
        }
    }

    closeHistoryModal() {
        document.getElementById('historyModal').classList.remove('active');
    }

    async loadReports() {
        try {
            const reports = await API.getReports();
            this.renderReports(reports);
        } catch (error) {
            console.error('Failed to load reports:', error);
        }
    }

    renderReports(reports) {
        const container = document.getElementById('reportsContainer');
        
        if (reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No reports yet</h3>
                    <p>Weekly reports will appear here. Click "Generate Report" to create one now.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reports.map(report => `
            <div class="report-card slide-up">
                <div class="report-header">
                    <span class="report-date">
                        ${Utils.formatDateShort(report.week_start)} - ${Utils.formatDateShort(report.week_end)}
                    </span>
                    <span class="report-score">${report.overall_score}%</span>
                </div>
                <div class="report-stats">
                    <div class="report-stat">
                        <span class="stat-value">${report.total_habits}</span>
                        <span class="stat-label">Habits Tracked</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-value">${report.total_completions}</span>
                        <span class="stat-label">Completions</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-value">${Utils.formatDateShort(report.generated_at)}</span>
                        <span class="stat-label">Generated</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async generateReport() {
        try {
            const report = await API.generateReport();
            this.showToast('Weekly report generated!', 'success');
            await this.loadReports();
        } catch (error) {
            this.showToast(error.message || 'Failed to generate report', 'error');
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : '⚠'}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.habitApp = new HabitApp();
});
