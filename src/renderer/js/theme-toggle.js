class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(this.currentTheme);
        this.setupToggleListener();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        
        this.updateToggleButton();
        
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    setupToggleListener() {
        this.createToggleButton();
    }

    createToggleButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        if (document.getElementById('theme-toggle')) return;

        const toggleButton = document.createElement('button');
        toggleButton.id = 'theme-toggle';
        toggleButton.className = 'btn btn-secondary theme-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle theme');
        toggleButton.setAttribute('title', 'Toggle dark/light mode');
        
        this.updateToggleButton(toggleButton);
        
        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });

        headerActions.insertBefore(toggleButton, headerActions.firstChild);
    }

    updateToggleButton(button) {
        const toggleButton = button || document.getElementById('theme-toggle');
        if (!toggleButton) return;

        const isDark = this.currentTheme === 'dark';
        toggleButton.innerHTML = `
            <span class="theme-icon">${isDark ? '☀️' : '🌙'}</span>
            <span class="theme-text">${isDark ? 'Light' : 'Dark'}</span>
        `;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} 