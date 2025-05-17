// Тест для проверки CORS соединения с API сервером для мобильного приложения
const axios = require('axios');

async function testCorsConnection() {
  console.log('===== ТЕСТИРОВАНИЕ CORS СОЕДИНЕНИЯ ДЛЯ МОБИЛЬНОГО ПРИЛОЖЕНИЯ =====');
  
  // Получаем IP адрес машины
  const serverIP = process.env.SERVER_IP || ' 192.168.1.105'; // Измените на ваш IP
  const apiPort = 8000;
  const mobilePort = 3000;
  
  console.log(`Сервер: ${serverIP}:${apiPort}`);
  console.log(`Мобильное приложение: ${serverIP}:${mobilePort}`);
  
  // Список эндпоинтов для проверки
  const endpoints = [
    'health',
    'seasons',
    'fields',
    'seeds',
    'seasons/1/fields'
  ];
  
  // Заголовки, имитирующие запрос из мобильного браузера
  const headers = {
    'Origin': `http://${serverIP}:${mobilePort}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  };
  
  // Проверяем каждый эндпоинт
  for (const endpoint of endpoints) {
    console.log(`\n=== Тестирование эндпоинта: /api/${endpoint} ===`);
    
    try {
      // Выполняем запрос к API серверу с нужными заголовками
      console.log(`Запрос: GET http://${serverIP}:${apiPort}/api/${endpoint}`);
      const startTime = Date.now();
      const response = await axios.get(
        `http://${serverIP}:${apiPort}/api/${endpoint}`, 
        { 
          headers,
          withCredentials: true
        }
      );
      const endTime = Date.now();
      
      console.log(`✅ Успешно! Время: ${endTime - startTime}ms`);
      console.log(`Статус: ${response.status}`);
      
      // Проверяем CORS-заголовки
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];
      
      console.log('CORS заголовки:');
      for (const header of corsHeaders) {
        if (response.headers[header]) {
          console.log(`  ${header}: ${response.headers[header]}`);
        } else {
          console.log(`  ⚠️ Отсутствует заголовок ${header}`);
        }
      }
      
      // Выводим информацию о данных
      const data = response.data;
      if (Array.isArray(data)) {
        console.log(`Получено ${data.length} элементов`);
        if (data.length > 0) {
          console.log(`Пример первого элемента: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
      } else {
        console.log(`Данные: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Ошибка при запросе`);
      
      if (error.response) {
        // Сервер ответил с ошибкой
        console.log(`Статус: ${error.response.status}`);
        console.log(`Данные ошибки: ${JSON.stringify(error.response.data)}`);
        
        // Проверяем CORS-заголовки в ответе с ошибкой
        console.log('CORS заголовки в ответе с ошибкой:');
        const corsHeaders = [
          'access-control-allow-origin',
          'access-control-allow-credentials',
          'access-control-allow-methods',
          'access-control-allow-headers'
        ];
        
        for (const header of corsHeaders) {
          if (error.response.headers[header]) {
            console.log(`  ${header}: ${error.response.headers[header]}`);
          } else {
            console.log(`  ⚠️ Отсутствует заголовок ${header}`);
          }
        }
      } else if (error.request) {
        // Запрос был отправлен, но ответ не получен
        console.log(`⚠️ Запрос отправлен, но ответ не получен`);
      } else {
        // Ошибка при настройке запроса
        console.log(`⚠️ Ошибка настройки запроса: ${error.message}`);
      }
    }
  }
  
  // Тестируем OPTIONS запрос (предварительный запрос CORS)
  console.log('\n=== Тестирование OPTIONS запроса (CORS preflight) ===');
  
  try {
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: `http://${serverIP}:${apiPort}/api/seasons`,
      headers: {
        'Origin': `http://${serverIP}:${mobilePort}`,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization,Cache-Control'
      }
    });
    
    console.log(`✅ Успешно! Статус: ${optionsResponse.status}`);
    
    // Проверяем CORS-заголовки
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-max-age'
    ];
    
    console.log('CORS заголовки:');
    for (const header of corsHeaders) {
      if (optionsResponse.headers[header]) {
        console.log(`  ${header}: ${optionsResponse.headers[header]}`);
      } else {
        console.log(`  ⚠️ Отсутствует заголовок ${header}`);
      }
    }
  } catch (error) {
    console.log(`❌ Ошибка при OPTIONS запросе`);
    
    if (error.response) {
      console.log(`Статус: ${error.response.status}`);
      console.log(`Данные: ${JSON.stringify(error.response.data)}`);
      
      // Проверяем CORS-заголовки в ответе с ошибкой
      console.log('CORS заголовки в ответе с ошибкой:');
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];
      
      for (const header of corsHeaders) {
        if (error.response.headers[header]) {
          console.log(`  ${header}: ${error.response.headers[header]}`);
        } else {
          console.log(`  ⚠️ Отсутствует заголовок ${header}`);
        }
      }
    } else if (error.request) {
      console.log(`⚠️ Запрос отправлен, но ответ не получен`);
    } else {
      console.log(`⚠️ Ошибка настройки запроса: ${error.message}`);
    }
  }
  
  // Проверяем POST запрос
  console.log('\n=== Тестирование POST запроса ===');
  
  try {
    const postResponse = await axios.post(
      `http://${serverIP}:${apiPort}/api/seasons`,
      { name: 'Тестовый сезон из теста CORS' },
      { headers, withCredentials: true }
    );
    
    console.log(`✅ Успешно! Статус: ${postResponse.status}`);
    console.log(`Данные: ${JSON.stringify(postResponse.data)}`);
    
    // Проверяем CORS-заголовки
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-credentials'
    ];
    
    console.log('CORS заголовки:');
    for (const header of corsHeaders) {
      if (postResponse.headers[header]) {
        console.log(`  ${header}: ${postResponse.headers[header]}`);
      } else {
        console.log(`  ⚠️ Отсутствует заголовок ${header}`);
      }
    }
  } catch (error) {
    console.log(`❌ Ошибка при POST запросе`);
    
    if (error.response) {
      console.log(`Статус: ${error.response.status}`);
      console.log(`Данные: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log(`⚠️ Запрос отправлен, но ответ не получен`);
    } else {
      console.log(`⚠️ Ошибка настройки запроса: ${error.message}`);
    }
  }
  
  console.log('\n===== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО =====');
}

// Запускаем тест
testCorsConnection().catch(error => {
  console.error('Необработанная ошибка:', error);
}); 