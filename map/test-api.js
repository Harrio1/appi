// Скрипт для тестирования API-соединения
const axios = require('axios');

// Проверка всех основных эндпоинтов API
async function testApiEndpoints() {
  console.log('===== ТЕСТИРОВАНИЕ API ЭНДПОИНТОВ =====');
  
  // Тест GET эндпоинтов
  const getEndpoints = [
    'http://127.0.0.1:8000/api/health',
    'http://127.0.0.1:8000/api/seasons',
    'http://127.0.0.1:8000/api/fields',
    'http://127.0.0.1:8000/api/seeds'
  ];
  
  console.log('\n== Тестирование GET запросов ==');
  for (const endpoint of getEndpoints) {
    try {
      console.log(`\nЗапрос: GET ${endpoint}`);
      const response = await axios.get(endpoint);
      console.log(`✅ Статус: ${response.status}`);
      console.log(`Данные: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        console.log(`  Статус: ${error.response.status}`);
        console.log(`  Данные: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  // Тест POST эндпоинтов через прокси
  console.log('\n== Тестирование прокси маршрутизации (локальный адрес) ==');
  const proxyEndpoints = [
    'http://127.0.0.1:3003/api/health',
    'http://127.0.0.1:3003/api/seasons',
    'http://127.0.0.1:3003/api/fields',
    'http://127.0.0.1:3003/api/seeds'
  ];
  
  for (const endpoint of proxyEndpoints) {
    try {
      console.log(`\nЗапрос: GET ${endpoint}`);
      const response = await axios.get(endpoint);
      console.log(`✅ Статус: ${response.status}`);
      console.log(`Данные: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        console.log(`  Статус: ${error.response.status}`);
        console.log(`  Данные: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  
  for (const test of postTests) {
    try {
      console.log(`\nТест: ${test.name}`);
      console.log(`Запрос: POST ${test.url}`);
      console.log(`Данные: ${JSON.stringify(test.data)}`);
      
      const response = await axios.post(test.url, test.data);
      console.log(`✅ Статус: ${response.status}`);
      console.log(`Ответ: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        console.log(`  Статус: ${error.response.status}`);
        console.log(`  Данные: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  // Тест POST эндпоинтов через прокси
  console.log('\n== Тестирование POST запросов через прокси ==');
  const proxyPostTests = [
    {
      name: 'Создание тестового сезона через прокси',
      url: 'http://127.0.0.1:3003/api/seasons',
      data: { name: 'Тестовый сезон через прокси' }
    },
    {
      name: 'Создание тестового поля через прокси',
      url: 'http://127.0.0.1:3003/api/fields',
      data: { 
        name: 'Тестовое поле через прокси', 
        coordinates: [[55.123, 37.456], [55.124, 37.456], [55.124, 37.457], [55.123, 37.457], [55.123, 37.456]],
        area: 100
      }
    }
  ];
  
  for (const test of proxyPostTests) {
    try {
      console.log(`\nТест: ${test.name}`);
      console.log(`Запрос: POST ${test.url}`);
      console.log(`Данные: ${JSON.stringify(test.data)}`);
      
      const response = await axios.post(test.url, test.data);
      console.log(`✅ Статус: ${response.status}`);
      console.log(`Ответ: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        console.log(`  Статус: ${error.response.status}`);
        console.log(`  Данные: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

// Запускаем тесты
testApiEndpoints().catch(console.error); 