// Тест для проверки POST запросов через apiClient
const axios = require('axios');

async function testApiClientPost() {
  console.log('===== ТЕСТИРОВАНИЕ POST ЗАПРОСОВ ЧЕРЕЗ API CLIENT =====\n');
  
  // Создаем экземпляр axios, который будет работать через прокси
  const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:3003/api',
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true
  });
  
  // Добавляем перехватчик для вывода информации о запросах
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`Отправка ${config.method.toUpperCase()} запроса на ${config.url}`);
      console.log('Данные:', JSON.stringify(config.data || {}));
      return config;
    },
    (error) => {
      console.error('Ошибка при отправке запроса:', error);
      return Promise.reject(error);
    }
  );
  
  // Тестовые POST запросы
  const testCases = [
    {
      name: 'Создание сезона',
      endpoint: '/seasons',
      data: { name: 'Тестовый сезон с прокси' }
    },
    {
      name: 'Создание поля',
      endpoint: '/fields',
      data: {
        name: 'Тестовое поле с прокси',
        coordinates: [[55.123, 37.456], [55.124, 37.456], [55.124, 37.457], [55.123, 37.457], [55.123, 37.456]],
        area: 100
      }
    },
    {
      name: 'Создание семени',
      endpoint: '/seeds',
      data: { name: 'Тестовая культура с прокси' }
    }
  ];
  
  // Проверка соединения
  try {
    console.log('Проверка соединения с API...');
    const healthResponse = await apiClient.get('/health');
    console.log('✅ API соединение работает:', healthResponse.data);
    console.log('');
  } catch (error) {
    console.error('❌ Ошибка соединения с API:', error.message);
    if (error.response) {
      console.error('  Статус:', error.response.status);
      console.error('  Данные:', error.response.data);
    }
    console.log('');
  }
  
  // Выполняем тесты
  for (const test of testCases) {
    console.log(`=== Тест: ${test.name} ===`);
    
    try {
      // Используем axios напрямую для отправки запроса с полным URI
      console.log('Метод 1: Прямой запрос на API сервер');
      const directResponse = await axios.post(`http://127.0.0.1:8000/api${test.endpoint}`, test.data);
      console.log('✅ Прямой запрос успешен:', directResponse.status);
      console.log('Ответ:', JSON.stringify(directResponse.data));
    } catch (error) {
      console.error('❌ Ошибка прямого запроса:', error.message);
      if (error.response) {
        console.error('  Статус:', error.response.status);
        console.error('  Данные:', error.response.data);
      }
    }
    
    console.log('');
    
    try {
      // Используем apiClient для запроса через прокси
      console.log('Метод 2: Запрос через прокси React-приложения');
      const proxyResponse = await apiClient.post(test.endpoint, test.data);
      console.log('✅ Запрос через прокси успешен:', proxyResponse.status);
      console.log('Ответ:', JSON.stringify(proxyResponse.data));
    } catch (error) {
      console.error('❌ Ошибка запроса через прокси:', error.message);
      if (error.response) {
        console.error('  Статус:', error.response.status);
        console.error('  Данные:', error.response.data);
      }
    }
    
    console.log('\n--------------------------\n');
  }
}

testApiClientPost().catch(error => {
  console.error('Необработанная ошибка:', error);
}); 