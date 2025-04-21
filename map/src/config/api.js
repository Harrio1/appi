// Определяем базовый URL для API в зависимости от среды
let baseUrl;

// Принудительно используем порт 3003 для API
const apiPort = '3003';

// В production версии используем относительные пути
if (process.env.NODE_ENV === 'production') {
  baseUrl = '/api';
} else {
  // Для разработки используем полный URL
  const apiHost = window.location.hostname; // Используем текущий хост
  baseUrl = `http://${apiHost}:${apiPort}/api`; // Жестко задаем порт 3003
}

export const API_URL = baseUrl;

// Log API URL на клиентской стороне для отладки
console.log('API URL configured as:', API_URL);
console.log('Using port:', apiPort);