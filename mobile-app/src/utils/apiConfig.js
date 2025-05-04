import axios from 'axios';

// Определяем базовый URL для API в мобильном режиме
let baseUrl;

// Получаем порт API сервера из переменных окружения
const apiPort = '8000';
// Установка IP адреса вашего API сервера, который всегда доступен
const apiHost = '192.168.1.110'; 

// В production версии (на телефоне) используем IP-адрес сервера
if (process.env.NODE_ENV === 'production') {
  // В реальном проекте здесь должен быть указан IP-адрес вашего сервера
  baseUrl = `http://${apiHost}:${apiPort}/api`;
} else {
  // В режиме разработки используем тот же IP адрес
  baseUrl = `http://${apiHost}:${apiPort}/api`;
}

// Логируем API URL при запуске для отладки
console.log('API URL настроен как:', baseUrl);
console.log('Текущее окружение:', process.env.NODE_ENV);

export const API_URL = baseUrl;

// Функция для обработки ограниченных запросов с повторными попытками
export const handleRateLimitedRequest = async (requestFunc, key, retryCount = 0) => {
  try {
    return await requestFunc();
  } catch (error) {
    if (error.response && error.response.status === 429 && retryCount < 3) {
      // Если сервер вернул код 429 (слишком много запросов), ждем и пробуем снова
      console.log(`Превышен лимит запросов. Повторная попытка ${retryCount + 1}/3 через 1 секунду...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return handleRateLimitedRequest(requestFunc, key, retryCount + 1);
    }
    throw error;
  }
};

// Функция для получения данных с обработкой ошибок
export const fetchData = async (endpoint) => {
  try {
    console.log(`Выполняем запрос к ${API_URL}/${endpoint}`);
    const response = await axios.get(`${API_URL}/${endpoint}`);
    return response;
  } catch (error) {
    console.error(`Ошибка при запросе ${endpoint}:`, error);
    throw error;
  }
};

export default API_URL; 