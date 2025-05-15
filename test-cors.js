// Тест для проверки CORS соединения с API сервером для мобильного приложения
const axios = require('axios');

async function testCorsConnection() {
  console.log('===== ТЕСТИРОВАНИЕ CORS СОЕДИНЕНИЯ ДЛЯ МОБИЛЬНОГО ПРИЛОЖЕНИЯ =====');
  
  // Hard-coded to match exact origin in allowedOrigins
  const origin = 'http:// 192.168.1.103:3000';
  const serverIP = ' 192.168.1.103';
  const apiPort = 8000;
  
  console.log(`Используется фиксированный Origin заголовок: ${origin}`);
  console.log(`API сервер: ${serverIP}:${apiPort}`);
  
  // Тестирование простого HEAD запроса для просмотра всех заголовков ответа
  console.log('\n=== Тестирование HEAD запроса для просмотра всех заголовков ===');
  try {
    const headResponse = await axios.head(
      `http://${serverIP}:${apiPort}/api/health`,
      {
        headers: { 'Origin': origin },
        withCredentials: true
      }
    );
    
    console.log('✅ HEAD запрос успешен');
    console.log('Статус:', headResponse.status);
    console.log('\nВсе заголовки ответа:');
    Object.entries(headResponse.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.log('❌ Ошибка при HEAD запросе');
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('\nВсе заголовки ответа:');
      Object.entries(error.response.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    } else {
      console.log('Ошибка:', error.message);
    }
  }
  
  // Тестируем OPTIONS запрос (предварительный запрос CORS)
  console.log('\n=== Тестирование OPTIONS запроса (CORS preflight) ===');
  
  try {
    const optionsHeaders = {
      'Origin': origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type,Authorization'
    };
    
    console.log(`Запрос: OPTIONS http://${serverIP}:${apiPort}/api/seasons`);
    console.log('Заголовки:', JSON.stringify(optionsHeaders, null, 2));
    
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: `http://${serverIP}:${apiPort}/api/seasons`,
      headers: optionsHeaders
    });
    
    console.log(`✅ Успешно! Статус: ${optionsResponse.status}`);
    
    // Выводим все заголовки ответа для отладки
    console.log('\nВсе заголовки ответа:');
    Object.entries(optionsResponse.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.log(`❌ Ошибка при OPTIONS запросе`);
    
    if (error.response) {
      console.log(`Статус: ${error.response.status}`);
      console.log(`Данные: ${JSON.stringify(error.response.data)}`);
      
      console.log('\nВсе заголовки ответа:');
      Object.entries(error.response.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
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