const fs = require('fs');
const path = require('path');

class Translator {
  constructor() {
    this.translations = {};
    this.defaultLang = 'en';
    this.supportedLanguages = ['en', 'am', 'om', 'ti', 'so'];
    this.loadTranslations();
  }

  loadTranslations() {
    for (const lang of this.supportedLanguages) {
      const filePath = path.join(__dirname, '../locales', lang, 'translation.json');
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translations[lang] = JSON.parse(content);
      } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error.message);
        this.translations[lang] = {};
      }
    }
  }

  translate(key, lang = 'en', interpolations = {}) {
    const language = this.supportedLanguages.includes(lang) ? lang : this.defaultLang;

    const keys = key.split('.');
    let value = this.translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to English if translation not found
    if (value === undefined && language !== this.defaultLang) {
      value = this.translations[this.defaultLang];
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }
    }

    // Return key if no translation found
    if (value === undefined) {
      return key;
    }

    // Handle interpolations
    if (typeof value === 'string' && Object.keys(interpolations).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return interpolations[variable] !== undefined ? interpolations[variable] : match;
      });
    }

    return value;
  }

  t(key, lang = 'en', interpolations = {}) {
    return this.translate(key, lang, interpolations);
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  isLanguageSupported(lang) {
    return this.supportedLanguages.includes(lang);
  }
}

const translator = new Translator();

module.exports = {
  translate: translator.translate.bind(translator),
  t: translator.t.bind(translator),
  translator,
};
