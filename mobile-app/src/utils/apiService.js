import axios from 'axios';
import API_URL, { handleRateLimitedRequest, apiClient } from './apiConfig';
import StorageService from './storageService';

// Проверка состояния сети
const isOnline = () => {
  return navigator.onLine;
};

// Отслеживание изменения состояния сети
export const setupNetworkListeners = () => {
  window.addEventListener('online', async () => {
    console.log('Подключение к сети восстановлено');
    await StorageService.saveNetworkState(true);
    // При восстановлении соединения можно вызвать синхронизацию
    // syncData();
  });

  window.addEventListener('offline', async () => {
    console.log('Соединение с сетью потеряно. Переход в оффлайн режим.');
    await StorageService.saveNetworkState(false);
  });
};

// Базовый метод для получения данных с учетом оффлайн режима
export const fetchDataWithOfflineSupport = async (endpoint, storeName, forceOnline = false) => {
  // Проверяем, есть ли подключение к сети
  const online = isOnline();
  
  console.log('Состояние сети:', online ? 'онлайн' : 'оффлайн', 'Принудительный режим:', forceOnline ? 'оффлайн' : 'нет');
  
  // Очищаем endpoint от начального слеша
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  console.log('Запрос к API endpoint:', cleanEndpoint);
  
  // Если мы в сети и не требуется форсированный оффлайн режим
  if (online && !forceOnline) {
    try {
      console.log(`Загружаем ${cleanEndpoint} с сервера`);
      // Запрашиваем данные с сервера используя apiClient
      const response = await handleRateLimitedRequest(
        () => apiClient.get(cleanEndpoint),
        `get-${cleanEndpoint}`
      );
      
      console.log(`Данные с сервера для ${cleanEndpoint} получены:`, response.data ? `${response.data.length} записей` : 'нет данных');
      
      // Сохраняем полученные данные в локальное хранилище
      if (response && response.data) {
        await StorageService.saveData(storeName, response.data);
        // Обновляем время последней синхронизации
        await StorageService.saveLastSyncTime();
      }
      
      return response.data;
    } catch (error) {
      console.error(`Ошибка при загрузке ${cleanEndpoint}:`, error);
      
      // Более подробная информация об ошибке
      if (error.response) {
        console.error(`Статус ошибки: ${error.response.status}`);
        console.error(`Данные ошибки:`, error.response.data);
        console.error(`Заголовки ответа:`, error.response.headers);
      } else if (error.request) {
        console.error(`Нет ответа от сервера`);
      } else {
        console.error(`Ошибка запроса: ${error.message}`);
      }
      
      // Если произошла ошибка, пробуем получить данные из локального хранилища
      console.log(`Пробуем получить ${cleanEndpoint} из кэша...`);
      const cachedData = await StorageService.getAllData(storeName);
      
      console.log(`Данные из кэша для ${cleanEndpoint}:`, cachedData ? `${cachedData.length} записей` : 'нет данных');
      
      if (cachedData && cachedData.length > 0) {
        console.log(`Данные ${cleanEndpoint} загружены из кэша`);
        return cachedData;
      }
      
      // Если в кэше ничего нет, пробрасываем ошибку дальше
      throw error;
    }
  } else {
    // Мы не в сети, используем данные из кэша
    console.log(`Оффлайн режим: загрузка ${cleanEndpoint} из кэша...`);
    const cachedData = await StorageService.getAllData(storeName);
    
    console.log(`Данные из кэша для ${cleanEndpoint} (оффлайн):`, cachedData ? `${cachedData.length} записей` : 'нет данных');
    
    if (cachedData && cachedData.length > 0) {
      console.log(`Данные ${cleanEndpoint} загружены из кэша (оффлайн режим)`);
      return cachedData;
    } else {
      throw new Error(`Нет данных ${cleanEndpoint} в кэше для оффлайн режима`);
    }
  }
};

// Специализированные методы для каждого типа данных
export const fetchFields = async (forceOffline = false) => {
  try {
    const data = await fetchDataWithOfflineSupport('fields', StorageService.STORES.FIELDS, forceOffline);
    // Форматируем данные полей для корректного отображения
    return formatFieldsData(data);
  } catch (error) {
    console.error('Ошибка при получении полей:', error);
    throw error;
  }
};

export const fetchSeasons = async (forceOffline = false) => {
  return fetchDataWithOfflineSupport('seasons', StorageService.STORES.SEASONS, forceOffline);
};

export const fetchCrops = async (forceOffline = false) => {
  return fetchDataWithOfflineSupport('seeds', StorageService.STORES.CROPS, forceOffline);
};

export const fetchFieldsForSeason = async (seasonId, forceOffline = false) => {
  if (!seasonId) return [];
  
  try {
    const data = await fetchDataWithOfflineSupport(
      `seasons/${seasonId}/fields`, 
      StorageService.STORES.FIELDS,
      forceOffline
    );
    // Форматируем данные полей для корректного отображения
    return formatFieldsData(data);
  } catch (error) {
    console.error(`Ошибка при загрузке полей для сезона ${seasonId}:`, error);
    throw error;
  }
};

// Получить время последней синхронизации в виде отформатированной строки
export const getLastSyncTimeFormatted = async () => {
  const timestamp = await StorageService.getLastSyncTime();
  if (!timestamp) return 'Никогда';
  
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

// Функция для форматирования данных полей
const formatFieldsData = (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    console.warn('Нет данных полей для форматирования');
    return [];
  }
  
  console.log('Форматирование данных полей, исходное количество:', fields.length);
  console.log('Пример входных данных поля:', JSON.stringify(fields[0]).substring(0, 200) + '...');
  
  return fields.map((field, index) => {
    // Создаем копию поля для изменений
    const formattedField = { ...field };
    
    // Обрабатываем координаты
    try {
      // Проверка на наличие координат
      if (!field.coordinates) {
        console.warn(`Поле ${index}, ID: ${field.id || 'неизвестен'} - отсутствуют координаты`);
        formattedField.coordinates = [];
        return formattedField;
      }
      
      // Преобразование строки JSON в объект, если необходимо
        if (typeof field.coordinates === 'string') {
          try {
            formattedField.coordinates = JSON.parse(field.coordinates);
          console.log(`Поле ${index}, ID: ${field.id} - координаты распарсены из JSON строки`);
          } catch (e) {
          console.error(`Поле ${index}, ID: ${field.id} - ошибка парсинга JSON координат:`, e);
          console.log('Проблемная строка координат:', field.coordinates.substring(0, 100) + '...');
            formattedField.coordinates = [];
          return formattedField;
        }
      }
      
      // Логируем исходный тип и структуру координат для отладки
      const coordType = typeof formattedField.coordinates;
      const isArray = Array.isArray(formattedField.coordinates);
      const hasCoordProperty = formattedField.coordinates && formattedField.coordinates.coordinates;
      console.log(`Поле ${index}, ID: ${field.id} - тип координат: ${coordType}, массив: ${isArray}, имеет свойство coordinates: ${hasCoordProperty}`);
      
      // Обработка формата из скриншота (как отображается в основной версии)
      // Числовые идентификаторы полей в красных многоугольниках (123, 22222, 55555 и т.д.)
      if (formattedField.coordinates && 
          typeof formattedField.coordinates === 'object' &&
          formattedField.coordinates.coordinates && 
          Array.isArray(formattedField.coordinates.coordinates)) {
        console.log(`Поле ${index}, ID: ${field.id} - обнаружен формат API со вложенными координатами`);
        
        // В скриншоте поля правильно отображаются, значит этот формат корректный
        // Используем непосредственно массив coordinates из объекта
        formattedField.coordinates = formattedField.coordinates.coordinates;
        
        // Проверим и логируем формат точек для отладки
        if (formattedField.coordinates.length > 0 && Array.isArray(formattedField.coordinates[0])) {
          console.log(`Поле ${index} - формат точек: [${typeof formattedField.coordinates[0][0]}, ${typeof formattedField.coordinates[0][1]}]`);
          console.log(`Первая точка: ${JSON.stringify(formattedField.coordinates[0])}`);
        }
      }
      
      // Координаты должны быть массивом
      if (!Array.isArray(formattedField.coordinates)) {
        console.warn(`Поле ${index}, ID: ${field.id} - координаты не являются массивом:`, typeof formattedField.coordinates);
        formattedField.coordinates = [];
        return formattedField;
      }
      
      // Проверка и преобразование формата координат
      // Если координаты в формате GeoJSON Feature
      if (formattedField.coordinates.type === 'Feature' && formattedField.coordinates.geometry) {
        console.log(`Поле ${index}, ID: ${field.id} - преобразование из GeoJSON Feature`);
        formattedField.coordinates = formattedField.coordinates.geometry.coordinates;
      }
      // Если координаты в формате GeoJSON геометрии
      else if (formattedField.coordinates.type && formattedField.coordinates.coordinates) {
        console.log(`Поле ${index}, ID: ${field.id} - преобразование из GeoJSON геометрии`);
        formattedField.coordinates = formattedField.coordinates.coordinates;
      }
      
      // Проверка на формат точек и преобразование при необходимости
        if (Array.isArray(formattedField.coordinates)) {
        // Если это массив чисел [lon, lat, lon, lat, ...], преобразуем в [[lon, lat], [lon, lat], ...]
        if (formattedField.coordinates.length > 0 && typeof formattedField.coordinates[0] === 'number') {
          console.log(`Поле ${index}, ID: ${field.id} - преобразование из плоского массива чисел`);
          const points = [];
          for (let i = 0; i < formattedField.coordinates.length; i += 2) {
            if (i + 1 < formattedField.coordinates.length) {
              points.push([formattedField.coordinates[i], formattedField.coordinates[i+1]]);
            }
          }
          formattedField.coordinates = points;
        }
        
        // Проверяем, что массив точек не содержит вложенных массивов многоугольников
        // (т.е. координаты должны быть в формате [[lat, lon], [lat, lon], ...], а не [[[lat, lon], ...]])
          if (formattedField.coordinates.length > 0 && 
              Array.isArray(formattedField.coordinates[0]) && 
            Array.isArray(formattedField.coordinates[0][0])) {
          console.log(`Поле ${index}, ID: ${field.id} - обнаружен вложенный массив полигонов, берем первый полигон`);
          // Берем первый полигон, если это массив полигонов
          formattedField.coordinates = formattedField.coordinates[0];
        }
        
        // Логируем результат форматирования
        if (formattedField.coordinates.length > 0) {
          console.log(`Поле ${index}, ID: ${field.id} - координаты готовы: ${formattedField.coordinates.length} точек`);
          console.log(`Пример первых двух точек: ${JSON.stringify(formattedField.coordinates.slice(0, 2))}`);
        } else {
          console.warn(`Поле ${index}, ID: ${field.id} - пустой массив координат после форматирования`);
        }
      }
    } catch (error) {
      console.error(`Поле ${index}, ID: ${field.id} - ошибка обработки координат:`, error);
      formattedField.coordinates = [];
    }
    
    return formattedField;
  });
};

export default {
  fetchFields,
  fetchSeasons,
  fetchCrops,
  fetchFieldsForSeason,
  setupNetworkListeners,
  getLastSyncTimeFormatted,
  isOnline
}; 