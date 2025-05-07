// Скрипт для проверки CORS настроек
const axios = require('axios');

async function testCORS() {
  console.log('===== ТЕСТИРОВАНИЕ CORS НАСТРОЕК =====');
  
  // URL с разными источниками
  const urls = [
    { url: 'http://127.0.0.1:8000/api/health', headers: {} },
    { url: 'http://127.0.0.1:8000/api/seasons', headers: {} },
    { url: 'http://127.0.0.1:8000/api/seasons/1/fields', headers: {} },
    { 
      url: 'http://127.0.0.1:8000/api/health', 
      headers: { 
        'Origin': 'http://localhost:3003',
        'Cache-Control': 'no-cache'
      } 
    },
    { 
      url: 'http://127.0.0.1:8000/api/seasons/1/fields', 
      headers: { 
        'Origin': 'http://localhost:3003',
        'Cache-Control': 'no-cache'
      }
    }
  ];
  
  for (const { url, headers } of urls) {
    console.log(`\nПроверка: ${url}`);
    console.log(`Заголовки: ${JSON.stringify(headers)}`);
    
    try {
      const response = await axios.get(url, { 
        headers,
        withCredentials: Object.keys(headers).length > 0 // Включаем, если есть заголовки
      });
      
      console.log(`✅ Успешно (${response.status})`);
      console.log(`CORS заголовки в ответе:`);
      console.log(`  Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'отсутствует'}`);
      console.log(`  Access-Control-Allow-Credentials: ${response.headers['access-control-allow-credentials'] || 'отсутствует'}`);
      console.log(`  Access-Control-Allow-Headers: ${response.headers['access-control-allow-headers'] || 'отсутствует'}`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      
      if (error.response) {
        console.log(`  Статус: ${error.response.status}`);
        console.log(`  CORS заголовки в ответе:`);
        console.log(`    Access-Control-Allow-Origin: ${error.response.headers['access-control-allow-origin'] || 'отсутствует'}`);
        console.log(`    Access-Control-Allow-Credentials: ${error.response.headers['access-control-allow-credentials'] || 'отсутствует'}`);
        console.log(`    Access-Control-Allow-Headers: ${error.response.headers['access-control-allow-headers'] || 'отсутствует'}`);
      }
    }
  }
  
  console.log('\n===== ТЕСТИРОВАНИЕ CORS OPTIONS ЗАПРОСА =====');
  try {
    const response = await axios({
      method: 'OPTIONS',
      url: 'http://127.0.0.1:8000/api/seasons/1/fields',
      headers: {
        'Origin': 'http://localhost:3003',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'cache-control'
      }
    });
    
    console.log(`✅ Успешно (${response.status})`);
    console.log(`Заголовки в ответе:`);
    for (const [key, value] of Object.entries(response.headers)) {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  } catch (error) {
    console.log(`❌ Ошибка при OPTIONS запросе: ${error.message}`);
    
    if (error.response) {
      console.log(`  Статус: ${error.response.status}`);
      console.log(`  Заголовки в ответе:`);
      for (const [key, value] of Object.entries(error.response.headers)) {
        if (key.toLowerCase().includes('access-control')) {
          console.log(`    ${key}: ${value}`);
        }
      }
    }
  }
}

testCORS().catch(console.error); 