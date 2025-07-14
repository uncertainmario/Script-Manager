class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.availableLanguages = {
            'en': 'English',
            'tr': 'Türkçe'
        };
        
        this.loadDefaultLanguage();
    }

    async loadDefaultLanguage() {
        try {
            const savedLanguage = localStorage.getItem('app-language');
            if (savedLanguage && this.availableLanguages[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }
            
            await this.loadLanguage(this.currentLanguage);
        } catch (error) {
            console.error('Error loading default language:', error);
            await this.loadLanguage(this.fallbackLanguage);
        }
    }

    async loadLanguage(language) {
        try {
            const response = await fetch(`locales/${language}.json`);
            if (!response.ok) {
                throw new Error(`Language file not found: ${language}`);
            }
            
            const translations = await response.json();
            this.translations[language] = translations;
            this.currentLanguage = language;
            
            localStorage.setItem('app-language', language);
            
            document.documentElement.lang = language;
            
            return translations;
        } catch (error) {
            console.error(`Error loading language ${language}:`, error);
            
            if (language !== this.fallbackLanguage) {
                console.log(`Falling back to ${this.fallbackLanguage}`);
                return await this.loadLanguage(this.fallbackLanguage);
            }
            
            throw error;
        }
    }

    t(key, params = {}) {
        const translation = this.getTranslation(key, this.currentLanguage);
        
        if (translation) {
            return this.interpolate(translation, params);
        }
        
        if (this.currentLanguage !== this.fallbackLanguage) {
            const fallbackTranslation = this.getTranslation(key, this.fallbackLanguage);
            if (fallbackTranslation) {
                return this.interpolate(fallbackTranslation, params);
            }
        }
        
        console.warn(`Translation not found for key: ${key}`);
        return key;
    }

    getTranslation(key, language) {
        if (!this.translations[language]) {
            return null;
        }
        
        const keys = key.split('.');
        let result = this.translations[language];
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return null;
            }
        }
        
        return typeof result === 'string' ? result : null;
    }

    interpolate(text, params) {
        if (!params || Object.keys(params).length === 0) {
            return text;
        }
        
        let result = text;
        for (const [key, value] of Object.entries(params)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return result;
    }

    async changeLanguage(language) {
        if (!this.availableLanguages[language]) {
            throw new Error(`Language not supported: ${language}`);
        }
        
        const oldLanguage = this.currentLanguage;
        
        try {
            await this.loadLanguage(language);
            
            const event = new CustomEvent('languageChanged', {
                detail: { 
                    newLanguage: language, 
                    oldLanguage: oldLanguage 
                }
            });
            document.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error('Error changing language:', error);
            throw error;
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return this.availableLanguages;
    }

    getCurrentLanguageDisplayName() {
        return this.availableLanguages[this.currentLanguage] || this.currentLanguage;
    }

    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(element => {
            const attrData = element.getAttribute('data-i18n-attr');
            try {
                const attrs = JSON.parse(attrData);
                for (const [attr, key] of Object.entries(attrs)) {
                    const translation = this.t(key);
                    element.setAttribute(attr, translation);
                }
            } catch (error) {
                console.error('Error parsing i18n attribute data:', error);
            }
        });
    }

    async init() {
        try {
            await this.loadDefaultLanguage();
            this.updateDOM();
            
            document.addEventListener('languageChanged', () => {
                this.updateDOM();
            });
            
            console.log(`i18n initialized with language: ${this.currentLanguage}`);
        } catch (error) {
            console.error('Error initializing i18n:', error);
        }
    }
}

const i18n = new I18nManager();

window.i18n = i18n; 