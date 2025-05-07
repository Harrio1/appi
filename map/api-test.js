// Скрипт для проверки соединения с API
const axios = require('axios');

// Проверяем сервер на обоих возможных хостах
const testEndpoints = async () => {
  const endpoints = [
    // Проверка прямого доступа
    'http://127.0.0.1:8000/api/health',
    'http://127.0.0.1:8000/api/seasons',
    'http://127.0.0.1:8000/api/fields',
    
    // Проверка сезонов с полями
    'http://127.0.0.1:8000/api/seasons/1/fields',
    'http://127.0.0.1:8000/seasons/1/fields',
    
    // Проверка через localhost (IPv6)
    'http://localhost:8000/api/health',
    
    // Проверка без префикса /api (как в логах)
    'http://127.0.0.1:8000/health',
    'http://127.0.0.1:8000/seasons',
    'http://127.0.0.1:8000/fields'
  ];

  console.log('===== ТЕСТ API СОЕДИНЕНИЯ =====');
  
  for (const url of endpoints) {
    try {
      console.log(`\nПроверка: ${url}`);
      const start = Date.now();
      const response = await axios.get(url);
      const time = Date.now() - start;
      
      console.log(`✅ Успешно! Время: ${time}ms`);
      console.log(`   Статус: ${response.status}`);
      
      if (Array.isArray(response.data)) {
        console.log(`   Данные: Получено ${response.data.length} элементов`);
        if (response.data.length > 0) {
          console.log(`   Пример первого элемента:`, JSON.stringify(response.data[0]).substring(0, 100) + '...');
        }
      } else {
        console.log(`   Данные:`, response.data);
      }
    } catch (error) {
      console.log(`❌ Ошибка: ${url}`);
      console.log(`   Сообщение: ${error.message}`);
      
      if (error.response) {
        console.log(`   Код ошибки: ${error.response.status}`);
        console.log(`   Данные ответа:`, error.response.data);
      } else if (error.request) {
        console.log(`   Нет ответа от сервера - возможно, сервер не запущен`);
      }
    }
  }
  
  console.log('\n===== РЕЗУЛЬТАТЫ ТЕСТА =====');
  console.log('1. Если прямые URL с /api работают, но URL без /api не работают:');
  console.log('   - Проверьте, настроен ли сервер на обработку запросов без префикса /api');
  console.log('   - Возможно, нужно обновить server.mjs для обработки запросов к корневым маршрутам');
  console.log('2. Если маршруты /seasons/1/fields не работают:');
  console.log('   - Проверьте, что в базе данных существует сезон с ID = 1');
  console.log('   - Проверьте, что правильно настроен маршрут для сезонов с полями');
  console.log('3. Если IPv4 (127.0.0.1) работает, но IPv6 (localhost) не работает:');
  console.log('   - Используйте 127.0.0.1 вместо localhost во всех API вызовах');
};

testEndpoints(); 