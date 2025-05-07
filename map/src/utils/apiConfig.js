/**
 * Конфигурация API для мобильного приложения
 * Этот файл обеспечивает совместимость между разными режимами работы
 */

// Универсальный конфигурационный файл для API
// Поддерживает как десктопный, так и мобильный режимы
import axios from 'axios';

// Получаем порт API сервера из переменных окружения
// Используем порт 8000 для API-сервера
const apiPort = process.env.REACT_APP_API_PORT || '8000';
const mobileMode = process.env.REACT_APP_MOBILE_MODE === 'true';

// Определение хоста для API запросов
let apiHost = '127.0.0.1'; // Фиксированный IPv4 адрес
if (mobileMode) {
  // В мобильном режиме используем IP устройства
  apiHost = window.location.hostname;
}

// Формирование базового URL для API без завершающего слеша
let baseUrl;

// В development используем прокси через относительные пути
if (process.env.NODE_ENV === 'development') {
  // Для разработки используем относительные пути для работы через прокси
  baseUrl = '/api';
  console.log('[apiConfig] Используем относительный путь /api для прокси');
} else {
  // Для production используем полный URL
  baseUrl = `http://${apiHost}:${apiPort}/api`;
  console.log('[apiConfig] Используем полный URL для production');
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
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  },
  withCredentials: true // Для поддержки CORS с credentials
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
      // Убираем начальный слеш из URL для предотвращения дублирования
      if (config.url.startsWith('/')) {
        config.url = config.url.slice(1);
      }
      
      // Убираем двойные слеши
      config.url = config.url.replace(/\/+/g, '/');
    }
    
    console.log(`[apiConfig] Запрос к ${config.method.toUpperCase()} ${config.baseURL}/${config.url}`);
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
    // Используем apiClient для проверки здоровья
    const response = await apiClient.get('health');
    console.log('[apiConfig] API здоровье:', response.data);
    
    return response.status === 200;
  } catch (error) {
    console.warn('[apiConfig] Нет соединения с API сервером:', error.message);
    return false;
  }
};

// Отложенная проверка соединения
setTimeout(checkApiConnection, 1000);

// Экспортируем функцию для получения данных
export const fetchData = async (endpoint) => {
  try {
    // Удаляем начальный слеш, если он есть
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    console.log(`[apiConfig] Запрос GET данных:`, cleanEndpoint);
    
    // Используем наш apiClient для запросов
    const response = await apiClient.get(cleanEndpoint);
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