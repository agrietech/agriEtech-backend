require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://agrietech_user:agrietech_password@localhost:5432/agrietech_db?schema=public',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  AFRICAS_TALKING_API_KEY: process.env.AFRICAS_TALKING_API_KEY,
  AFRICAS_TALKING_USERNAME: process.env.AFRICAS_TALKING_USERNAME || 'sandbox',
  AFRICAS_TALKING_SENDER_ID: process.env.AFRICAS_TALKING_SENDER_ID || 'AgriEtech',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  OPEN_METEO_BASE_URL: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1',
  NASA_POWER_BASE_URL:
    process.env.NASA_POWER_BASE_URL || 'https://power.larc.nasa.gov/api/temporal/daily/point',
  GLOFAS_API_KEY: process.env.GLOFAS_API_KEY,
  EARTHDATA_BEARER_TOKEN: process.env.EARTHDATA_BEARER_TOKEN,
  PLANT_ID_API_KEY: process.env.PLANT_ID_API_KEY,
  PLANT_ID_API_URL: process.env.PLANT_ID_API_URL || 'https://api.plant.id/v2/identify',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  FIREBASE_SERVICE_ACCOUNT_PATH:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebase-service-account.json',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@agrietech.et',
};

module.exports = env;
