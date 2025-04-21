/**
 * Утилиты для отладки сетевых проблем
 */
import axios from 'axios';
import API_URL, { fetchData, checkApiConnection } from './apiConfig';

// Проверка доступности сервера
export const checkApiConnectionStatus = async () => {
  console.log('=== Проверка соединения с сервером ===');
  console.log('Используемый API URL:', API_URL);

  const endpoints = ['seasons', 'fields', 'seeds'];
  const results = {};

  for (const endpoint of endpoints) {
    console.log(`Проверка API точки ${endpoint}...`);
    
    try {
      const startTime = Date.now();
      // Используем fetchData для запроса к API
      const response = await fetchData(endpoint);
      const endTime = Date.now();
      
      results[endpoint] = {
        status: response.status || 200,
        time: `${endTime - startTime}ms`,
        success: true,
        data: response.data ? 'Получено' : 'Пусто',
        items: Array.isArray(response.data) ? response.data.length : 'Не массив'
      };
      
      console.log(`✅ API ${endpoint}: Успешно!`);
      console.log(`  - Статус: ${response.status || 200}`);
      console.log(`  - Время: ${endTime - startTime}ms`);
      console.log(`  - Данные: ${Array.isArray(response.data) ? `Массив [${response.data.length}]` : typeof response.data}`);
    } catch (error) {
      results[endpoint] = {
        success: false,
        error: error.message,
        code: error.code,
        isNetwork: error.message === 'Network Error'
      };
      
      console.error(`❌ API ${endpoint}: Ошибка!`);
      console.error(`  - Сообщение: ${error.message}`);
      console.error(`  - Код: ${error.code}`);
      
      if (error.response) {
        console.error(`  - Статус ответа: ${error.response.status}`);
        console.error(`  - Данные ответа:`, error.response.data);
      }
    }
  }

  // Проверим IP-адрес
  console.log('Проверка сетевых настроек...');
  console.log('- URL хост:', window.location.hostname);
  console.log('- Полный URL:', window.location.href);
  console.log('- API порт:', process.env.REACT_APP_API_PORT || '3003');

  return results;
};

// Диагностика при ошибке API
export const logApiError = (error, endpoint) => {
  console.error(`Ошибка API (${endpoint}):`, error.message);
  
  if (error.response) {
    // Есть ответ от сервера с ошибкой
    console.error(`Статус: ${error.response.status}`);
    console.error('Данные:', error.response.data);
    console.error('Заголовки:', error.response.headers);
  } else if (error.request) {
    // Запрос был сделан, но ответа нет
    console.error('Нет ответа от сервера');
    console.error('Запрос:', error.request);
  } else {
    // Ошибка при настройке запроса
    console.error('Ошибка настройки запроса:', error.message);
    console.error('Конфигурация:', error.config);
  }
  
  // Проверяем текущие настройки API
  console.log('Текущие API настройки:');
  console.log('- API URL:', API_URL);
  console.log('- API порт:', process.env.REACT_APP_API_PORT || '3003');
};

// Автоматически запускаем проверку при загрузке в режиме разработки
if (process.env.NODE_ENV !== 'production') {
  setTimeout(() => {
    console.log('Автоматическая проверка API...');
    checkApiConnection().then(available => {
      console.log(`API соединение: ${available ? 'доступно' : 'недоступно'}`);
      if (available) {
        checkApiConnectionStatus();
      }
    });
  }, 2000);
} 