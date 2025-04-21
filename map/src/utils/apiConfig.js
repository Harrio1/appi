/**
 * Конфигурация API для мобильного приложения
 * Этот файл обеспечивает совместимость между разными режимами работы
 */

// Универсальный конфигурационный файл для API
// Поддерживает как десктопный, так и мобильный режимы
import axios from 'axios';

// Получаем порт API сервера из переменных окружения
// Принудительно устанавливаем порт 3003
const apiPort = '3003';
const mobileMode = process.env.REACT_APP_MOBILE_MODE === 'true';

// Определение хоста для API запросов
let apiHost = 'localhost';
if (process.env.REACT_APP_API_HOST) {
  // Если хост явно указан в переменных окружения, используем его
  apiHost = process.env.REACT_APP_API_HOST;
} else {
  // Иначе используем текущий хост приложения
  apiHost = window.location.hostname;
}

// Формирование базового URL для API без завершающего слеша
let baseUrl;

// В production используем относительные пути
if (process.env.NODE_ENV === 'production') {
  baseUrl = '/api';
} else {
  // Для разработки используем полный URL без завершающего слеша
  baseUrl = `http://${apiHost}:${apiPort}/api`;
}

console.log('[apiConfig] Режим API:', mobileMode ? 'Мобильный' : 'Десктоп');
console.log('[apiConfig] Используемый хост:', apiHost);
console.log('[apiConfig] Используемый порт:', apiPort);
console.log('[apiConfig] Полный URL API:', baseUrl);

// Экспорт URL API
const API_URL = baseUrl;

// Настраиваем axios с базовым URL
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  }
});

// Функция для объединения путей без двойных слешей
const joinPaths = (base, path) => {
  if (!path) return base;
  
  // Удаляем начальный слеш из пути и завершающий слеш из базы
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${cleanBase}/${cleanPath}`;
};

// Добавляем перехватчик запросов для логирования и проверки URL
apiClient.interceptors.request.use(
  (config) => {
    // Правильное формирование URL
    if (config.url) {
      config.url = config.url.replace(/\/+/g, '/');
    }
    
    console.log(`[apiConfig] Запрос к ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('[apiConfig] Ошибка при настройке запроса:', error);
    return Promise.reject(error);
  }
);

// Проверка соединения с сервером
const checkApiConnection = async () => {
  try {
    // Формируем URL без двойных слешей
    const healthUrl = joinPaths(API_URL, 'health');
    console.log('[apiConfig] Проверка API здоровья:', healthUrl);
    
    // Используем прямой вызов axios
    const response = await axios.get(healthUrl);
    console.log('[apiConfig] API здоровье:', response.data);
    
    return response.status === 200;
  } catch (error) {
    console.warn('[apiConfig] Нет соединения с API сервером:', error.message);
    return false;
  }
};

// Отложенная проверка соединения
setTimeout(checkApiConnection, 1000);

// Экспортируем функцию для получения данных напрямую из базы данных
export const fetchData = async (endpoint) => {
  try {
    // Формируем URL без двойных слешей
    const url = joinPaths(API_URL, endpoint);
    console.log(`[apiConfig] Запрос данных:`, url);
    
    // Выполняем запрос напрямую через axios
    const response = await axios.get(url);
    return response;
  } catch (error) {
    console.error(`[apiConfig] Ошибка при запросе ${endpoint}:`, error.message);
    
    // Прокидываем ошибку дальше
    throw error;
  }
};

// Добавляем механизм ограничения запросов и повторных попыток
let pendingRequests = {};

// Функция для обработки ошибок ограничения запросов (код 429)
export const handleRateLimitedRequest = async (requestFunc, key, retryCount = 0) => {
  // Если уже есть ожидающий запрос с таким же ключом, вернем его
  if (pendingRequests[key]) {
    console.log(`[apiConfig] Объединение дублирующего запроса: ${key}`);
    return pendingRequests[key];
  }

  try {
    // Создаем и сохраняем Promise для запроса
    pendingRequests[key] = requestFunc();
    const response = await pendingRequests[key];
    return response;
  } catch (error) {
    // Прокидываем ошибку дальше
    throw error;
  } finally {
    // Очищаем сохраненный запрос
    delete pendingRequests[key];
  }
};

// Экспортируем состояние API и клиент axios
export { checkApiConnection, apiClient };

export default API_URL; 