// Определяем базовый URL для API в мобильном режиме
let baseUrl;

// Получаем порт API сервера из переменных окружения (принудительно 3003)
const apiPort = '3003';

// В production версии используем относительные пути
if (process.env.NODE_ENV === 'production') {
  baseUrl = '/api';
} else {
  // Определяем хост для API запросов
  // Используем текущий хост приложения для доступа к API
  // Это решит проблему с разными IP-адресами
  const hostname = window.location.hostname;
  
  baseUrl = `http://${hostname}:${apiPort}/api`;
  
  console.log('Mobile API will use: hostname:', hostname, 'port:', apiPort);
  console.log('Mobile mode enabled:', process.env.REACT_APP_MOBILE_MODE);
  console.log('Current environment:', process.env.NODE_ENV);
}

export const API_URL = baseUrl;

// Log API URL на клиентской стороне для отладки
console.log('Mobile API URL configured as:', API_URL); 