// Определяем базовый URL для API в мобильном режиме
let baseUrl;

// Используем правильный порт API сервера
const apiPort = process.env.REACT_APP_API_PORT || '8000';

// В production версии используем относительные пути
if (process.env.NODE_ENV === 'production') {
  baseUrl = '/api';
} else {
  // Проверяем, включен ли мобильный режим
  const isMobileMode = process.env.REACT_APP_MOBILE_MODE === 'true';
  
  if (isMobileMode) {
    // В мобильном режиме используем текущий хост
    const hostname = window.location.hostname;
    baseUrl = `http://${hostname}:${apiPort}/api`;
    console.log('Mobile mode enabled, using current hostname:', hostname);
  } else {
    // Для локальной разработки используем IPv4 localhost
    baseUrl = `http://127.0.0.1:${apiPort}/api`;
    console.log('Using localhost IPv4 for API connections');
  }
  
  console.log('Mobile mode enabled:', process.env.REACT_APP_MOBILE_MODE);
  console.log('Current environment:', process.env.NODE_ENV);
}

export const API_URL = baseUrl;

// Log API URL на клиентской стороне для отладки
console.log('Mobile API URL configured as:', API_URL); 