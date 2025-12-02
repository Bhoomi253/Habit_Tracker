const Utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    },

    formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    },

    formatDateFull(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    getTodayISO() {
        return new Date().toISOString().split('T')[0];
    },

    getHealthClass(status) {
        const classes = {
            excellent: 'health-excellent',
            good: 'health-good',
            needs_improvement: 'health-needs_improvement',
            critical: 'health-critical',
        };
        return classes[status] || 'health-good';
    },

    getHealthLabel(status) {
        const labels = {
            excellent: 'Excellent',
            good: 'Good',
            needs_improvement: 'Needs Improvement',
            critical: 'Critical',
        };
        return labels[status] || status;
    },

    getStreakBadgeClass(streak) {
        if (streak >= 7) return 'hot';
        if (streak >= 3) return 'warm';
        return 'cool';
    },

    getScoreColorClass(score) {
        if (score >= 75) return 'score-75-100';
        if (score >= 50) return 'score-50-75';
        if (score >= 25) return 'score-25-50';
        return 'score-0-25';
    },

    animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            const current = Math.round(start + (end - start) * easeOutQuad);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    generateId() {
        return Math.random().toString(36).substring(2, 11);
    },

    getStoredTheme() {
        return localStorage.getItem('dhas-theme') || 'light';
    },

    setStoredTheme(theme) {
        localStorage.setItem('dhas-theme', theme);
    },

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    getWeekDays() {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    },

    isToday(dateString) {
        return dateString === this.getTodayISO();
    },
};
