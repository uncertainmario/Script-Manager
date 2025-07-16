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
            // Her zaman İngilizce ile başla (stock davranış)
            let targetLanguage = 'en';
            
            // Main process'ten dil bilgisi almayı devre dışı bırak
            // try {
            //     if (window.electronAPI && window.electronAPI.getCurrentLanguage) {
            //         targetLanguage = await window.electronAPI.getCurrentLanguage();
            //         console.log('i18n: Language from main process:', targetLanguage);
            //     } else {
            //         console.log('i18n: electronAPI not available, using default');
            //     }
            // } catch (error) {
            //     console.warn('i18n: Could not get language from main process:', error);
            // }
            
            this.currentLanguage = targetLanguage;
            
            await this.loadLanguage(this.currentLanguage);
        } catch (error) {
            console.error('i18n: Error loading default language:', error);
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
            console.error('i18n: Language not supported:', language);
            throw new Error(`Language not supported: ${language}`);
        }
        
        const oldLanguage = this.currentLanguage;
        
        try {
            await this.loadLanguage(language);
            
            // Dil değişikliğini kaydet (session için)
            localStorage.setItem('app-language', language);
            
            const event = new CustomEvent('languageChanged', {
                detail: { 
                    newLanguage: language, 
                    oldLanguage: oldLanguage 
                }
            });
            document.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error('i18n: Error changing language:', error);
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
            
            // DOM'u güncelle
            this.updateDOM();
            
            // Language change event listener'ı kur
            document.addEventListener('languageChanged', () => {
                this.updateDOM();
            });
            
        } catch (error) {
            console.error('i18n: Error initializing:', error);
        }
    }
}

const i18n = new I18nManager();

window.i18n = i18n; 