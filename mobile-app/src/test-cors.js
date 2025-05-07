// Тест для проверки CORS соединения с API сервером с мобильного устройства
const axios = require('axios');

const testMobileCorsConnection = async () => {
  console.log('===== ТЕСТИРОВАНИЕ CORS ДЛЯ МОБИЛЬНОГО ПРИЛОЖЕНИЯ =====\n');
  
  // IP сервера
  const serverIP = ' 192.168.1.110';
  const apiPort = 8000;
  
  // Проверяем несколько эндпоинтов
  const endpoints = [
    'health',
    'seasons',
    'fields',
    'seeds'
  ];
  
  // Добавляем конфигурацию для axios
  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Origin': `http://${serverIP}:3000`
    },
    withCredentials: true
  };
  
  for (const endpoint of endpoints) {
    console.log(`\n=== Тестируем эндпоинт: /api/${endpoint} ===`);
    
    try {
      // Сначала пробуем с обычным GET запросом
      console.log(`Выполняем GET запрос к http://${serverIP}:${apiPort}/api/${endpoint}`);
      const response = await axios.get(
        `http://${serverIP}:${apiPort}/api/${endpoint}`, 
        axiosConfig
      );
      
      console.log('✅ Запрос успешен!');
      console.log('Статус:', response.status);
      console.log('CORS заголовки:');
      if (response.headers['access-control-allow-origin']) {
        console.log('  Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
      } else {
        console.log('  ⚠️ Отсутствует заголовок Access-Control-Allow-Origin');
      }
      
      if (response.headers['access-control-allow-credentials']) {
        console.log('  Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);
      }
      
      // Выводим краткие данные
      const data = response.data;
      if (Array.isArray(data)) {
        console.log(`Получено ${data.length} элементов`);
        if (data.length > 0) {
          console.log('Пример первого элемента:', JSON.stringify(data[0]).substring(0, 100) + '...');
        }
      } else {
        console.log('Данные:', JSON.stringify(data).substring(0, 100) + '...');
      }
    } catch (error) {
      console.log('❌ Ошибка при запросе!');
      console.log('Сообщение:', error.message);
      
      if (error.response) {
        console.log('Статус:', error.response.status);
        console.log('Данные:', JSON.stringify(error.response.data));
        console.log('Заголовки:');
        
        const headers = error.response.headers;
        if (headers['access-control-allow-origin']) {
          console.log('  Access-Control-Allow-Origin:', headers['access-control-allow-origin']);
        } else {
          console.log('  ⚠️ Отсутствует заголовок Access-Control-Allow-Origin');
        }
      } else if (error.request) {
        console.log('⚠️ Запрос был отправлен, но ответ не получен');
        console.log('Детали запроса:', error.request);
      } else {
        console.log('⚠️ Ошибка при настройке запроса:', error.message);
      }
    }
  }
  
  // Проверяем OPTIONS запрос для префлайт
  console.log('\n=== Тестируем префлайт OPTIONS запрос ===');
  
  try {
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: `http://${serverIP}:${apiPort}/api/seasons`,
      headers: {
        'Origin': `http://${serverIP}:3000`,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization,Cache-Control'
      }
    });
    
    console.log('✅ OPTIONS запрос успешен!');
    console.log('Статус:', optionsResponse.status);
    console.log('CORS заголовки:');
    
    const headers = optionsResponse.headers;
    if (headers['access-control-allow-origin']) {
      console.log('  Access-Control-Allow-Origin:', headers['access-control-allow-origin']);
    } else {
      console.log('  ⚠️ Отсутствует заголовок Access-Control-Allow-Origin');
    }
    
    if (headers['access-control-allow-methods']) {
      console.log('  Access-Control-Allow-Methods:', headers['access-control-allow-methods']);
    }
    
    if (headers['access-control-allow-headers']) {
      console.log('  Access-Control-Allow-Headers:', headers['access-control-allow-headers']);
    }
  } catch (error) {
    console.log('❌ Ошибка при OPTIONS запросе!');
    console.log('Сообщение:', error.message);
    
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('Данные:', JSON.stringify(error.response.data));
    }
  }
  
  console.log('\n===== ТЕСТ ЗАВЕРШЕН =====');
};

// Запускаем тест
testMobileCorsConnection().catch(error => {
  console.error('Необработанная ошибка:', error);
}); 