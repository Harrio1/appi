import axios from 'axios';

// Определяем базовый URL для API в мобильном режиме
let baseUrl;

// Получаем порт API сервера из переменных окружения
const apiPort = '8000';

// Функция для проверки доступности сервера
const checkServerAvailability = async (url) => {
  try {
    await axios.get(`${url}/health`, { 
      timeout: 2000,
      withCredentials: true,  // Добавляем для CORS с credentials
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log(`Сервер ${url} доступен`);
    return true;
  } catch (error) {
    console.log(`Сервер ${url} недоступен:`, error.message);
    return false;
  }
};

// Используем фиксированный IP адрес сервера
const apiHost = '192.168.1.105';
baseUrl = `http://${apiHost}:${apiPort}/api`;

// Логируем API URL при запуске для отладки
console.log('API URL настроен как:', baseUrl);
console.log('Текущее окружение:', process.env.NODE_ENV);
console.log('Хост приложения:', window.location.hostname);

export const API_URL = baseUrl;

// Создаем экземпляр axios с подходящими настройками для CORS
export const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 15000, // Увеличиваем таймаут до 15 секунд
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  },
  withCredentials: false
});

// Добавляем перехватчик для вывода информации о запросах
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Отправка ${config.method.toUpperCase()} запроса на ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Ошибка при отправке запроса:', error);
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки ответов и ошибок
apiClient.interceptors.response.use(
  (response) => {
    // Логирование успешных ответов для отладки
    if (response.config.url.includes('/api/')) {
      console.log(`Получен ответ от API ${response.config.url}:`, {
        status: response.status,
        data_length: Array.isArray(response.data) ? response.data.length : 'не массив',
        sample: Array.isArray(response.data) && response.data.length > 0 
          ? JSON.stringify(response.data[0]).substring(0, 100) + '...' 
          : 'нет данных'
      });
    }
    return response;
  },
  (error) => {
    // Добавляем информативные сообщения об ошибках
    if (error.response) {
      // Сервер ответил с кодом ошибки
      console.error('Сервер вернул ошибку:', error.response.status);
      console.error('Данные:', error.response.data);
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      console.error('Нет ответа от сервера:', error.request);
    } else {
      // Ошибка при настройке запроса
      console.error('Ошибка запроса:', error.message);
    }
    return Promise.reject(error);
  }
);

// Функция для обработки ограниченных запросов с повторными попытками
export const handleRateLimitedRequest = async (requestFunc, key, retryCount = 0) => {
  try {
    return await requestFunc();
  } catch (error) {
    // Если сервер недоступен и мы еще не пробовали localhost
    if (error.code === 'ECONNREFUSED' && apiHost !== 'localhost' && retryCount === 0) {
      console.log('Попытка переключения на localhost...');
      apiHost = 'localhost';
      baseUrl = `http://${apiHost}:${apiPort}/api`;
      apiClient.defaults.baseURL = baseUrl;
      console.log('API URL изменен на:', baseUrl);
      return handleRateLimitedRequest(requestFunc, key, retryCount + 1);
    }
    
    // Если сервер вернул код 429 (слишком много запросов), ждем и пробуем снова
    if (error.response && error.response.status === 429 && retryCount < 3) {
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
    // Удаляем начальный слеш, если он есть
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    console.log(`Выполняем GET запрос к ${cleanEndpoint}`);
    
    // Используем apiClient вместо прямого axios
    const response = await apiClient.get(cleanEndpoint);
    return response;
  } catch (error) {
    console.error(`Ошибка при запросе ${endpoint}:`, error);
    throw error;
  }
};

// Добавляем функцию для прямого обращения к API, минуя все промежуточные слои
export const directApiRequest = async (endpoint) => {
  try {
    console.log('Выполняется прямой запрос к API...');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `http://192.168.1.105:8000/${cleanEndpoint}`;
    
    console.log('URL запроса:', url);
    
    const response = await axios({
      method: 'GET',
      url: url,
      timeout: 15000, // Увеличиваем таймаут до 15 секунд
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false
    });
    
    console.log('Успешный ответ:', response.status);
    return response.data;
  } catch (error) {
    console.error('Ошибка прямого запроса:', error.message);
    if (error.response) {
      console.error('Код ответа:', error.response.status);
      console.error('Данные ответа:', error.response.data);
    }
    throw error;
  }
};

export default API_URL;