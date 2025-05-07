// Определяем базовый URL для API в зависимости от среды
let baseUrl;

// Используем порт 8000 для API
const apiPort = process.env.REACT_APP_API_PORT || '8000';

// В production версии используем относительные пути
if (process.env.NODE_ENV === 'production') {
  baseUrl = '/api';
} else {
  // Для разработки используем полный URL с IPv4
  baseUrl = `http://127.0.0.1:${apiPort}/api`; 
}

export const API_URL = baseUrl;

// Log API URL на клиентской стороне для отладки
console.log('API URL configured as:', API_URL);
console.log('Using port:', apiPort);