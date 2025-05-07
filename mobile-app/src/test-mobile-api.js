// Тестовый скрипт для проверки мобильного API соединения
import { apiClient } from './utils/apiConfig';
import { isOnline } from './utils/apiService';

// Функция для тестирования API соединения
const testMobileAPI = async () => {
  console.log('===== ТЕСТИРОВАНИЕ МОБИЛЬНОГО API СОЕДИНЕНИЯ =====');
  console.log('Состояние сети:', isOnline() ? 'онлайн' : 'оффлайн');
  
  // Список эндпоинтов для проверки
  const endpoints = [
    'health',
    'seasons',
    'fields',
    'seeds',
    'seasons/1/fields'
  ];
  
  // Проверяем каждый эндпоинт
  for (const endpoint of endpoints) {
    console.log(`\n=== Тестирование эндпоинта: ${endpoint} ===`);
    
    try {
      console.log(`Отправка GET запроса к ${endpoint}`);
      const startTime = Date.now();
      const response = await apiClient.get(endpoint);
      const endTime = Date.now();
      
      console.log(`✅ Успешно! Время: ${endTime - startTime}ms`);
      console.log(`   Статус: ${response.status}`);
      
      // Выводим информацию о данных
      const data = response.data;
      if (Array.isArray(data)) {
        console.log(`   Данные: Получено ${data.length} элементов`);
        if (data.length > 0) {
          console.log(`   Пример первого элемента: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
      } else {
        console.log(`   Данные: ${JSON.stringify(data)}`);
      }
      
      // Проверяем CORS заголовки
      if (response.headers['access-control-allow-origin']) {
        console.log(`   CORS: Access-Control-Allow-Origin = ${response.headers['access-control-allow-origin']}`);
      } else {
        console.log(`   CORS: Заголовок Access-Control-Allow-Origin отсутствует`);
      }
    } catch (error) {
      console.log(`❌ Ошибка при запросе ${endpoint}`);
      
      if (error.response) {
        console.log(`   Статус: ${error.response.status}`);
        console.log(`   Данные: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.log(`   Запрос отправлен, но ответ не получен`);
      } else {
        console.log(`   Ошибка настройки запроса: ${error.message}`);
      }
    }
  }
  
  console.log('\n===== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО =====');
};

// Функция для тестирования POST запроса
const testMobilePostAPI = async () => {
  console.log('\n===== ТЕСТИРОВАНИЕ POST ЗАПРОСОВ =====');
  
  const testCases = [
    {
      name: 'Создание тестового сезона',
      endpoint: 'seasons',
      data: { name: 'Тестовый сезон из мобильного' }
    },
    {
      name: 'Создание тестового поля',
      endpoint: 'fields',
      data: {
        name: 'Тестовое поле из мобильного',
        coordinates: [[55.123, 37.456], [55.124, 37.456], [55.124, 37.457], [55.123, 37.457], [55.123, 37.456]],
        area: 100
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n=== Тест: ${test.name} ===`);
    
    try {
      console.log(`Отправка POST запроса к ${test.endpoint}`);
      console.log(`Данные: ${JSON.stringify(test.data)}`);
      
      const response = await apiClient.post(test.endpoint, test.data);
      
      console.log(`✅ Успешно!`);
      console.log(`   Статус: ${response.status}`);
      console.log(`   Ответ: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log(`❌ Ошибка при выполнении POST запроса`);
      
      if (error.response) {
        console.log(`   Статус: ${error.response.status}`);
        console.log(`   Данные: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.log(`   Запрос отправлен, но ответ не получен`);
      } else {
        console.log(`   Ошибка настройки запроса: ${error.message}`);
      }
    }
  }
};

// Запуск тестов
const runTests = async () => {
  try {
    await testMobileAPI();
    await testMobilePostAPI();
  } catch (error) {
    console.error('Необработанная ошибка при выполнении тестов:', error);
  }
};

// Запускаем тесты при загрузке модуля
runTests(); 