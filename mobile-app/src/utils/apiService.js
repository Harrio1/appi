import axios from 'axios';
import API_URL, { handleRateLimitedRequest } from './apiConfig';
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
  
  // Если мы в сети и не требуется форсированный оффлайн режим
  if (online && !forceOnline) {
    try {
      console.log(`Загружаем ${endpoint} с сервера`);
      // Запрашиваем данные с сервера
      const response = await handleRateLimitedRequest(
        () => axios.get(`${API_URL}/${endpoint}`),
        `get-${endpoint}`
      );
      
      console.log(`Данные с сервера для ${endpoint} получены:`, response.data ? `${response.data.length} записей` : 'нет данных');
      
      // Сохраняем полученные данные в локальное хранилище
      if (response && response.data) {
        await StorageService.saveData(storeName, response.data);
        // Обновляем время последней синхронизации
        await StorageService.saveLastSyncTime();
      }
      
      return response.data;
    } catch (error) {
      console.error(`Ошибка при загрузке ${endpoint}:`, error);
      
      // Если произошла ошибка, пробуем получить данные из локального хранилища
      console.log(`Пробуем получить ${endpoint} из кэша...`);
      const cachedData = await StorageService.getAllData(storeName);
      
      console.log(`Данные из кэша для ${endpoint}:`, cachedData ? `${cachedData.length} записей` : 'нет данных');
      
      if (cachedData && cachedData.length > 0) {
        console.log(`Данные ${endpoint} загружены из кэша`);
        return cachedData;
      }
      
      // Если в кэше ничего нет, пробрасываем ошибку дальше
      throw error;
    }
  } else {
    // Мы не в сети, используем данные из кэша
    console.log(`Оффлайн режим: загрузка ${endpoint} из кэша...`);
    const cachedData = await StorageService.getAllData(storeName);
    
    console.log(`Данные из кэша для ${endpoint} (оффлайн):`, cachedData ? `${cachedData.length} записей` : 'нет данных');
    
    if (cachedData && cachedData.length > 0) {
      console.log(`Данные ${endpoint} загружены из кэша (оффлайн режим)`);
      return cachedData;
    } else {
      throw new Error(`Нет данных ${endpoint} в кэше для оффлайн режима`);
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
  
  return fields.map(field => {
    // Создаем копию поля для изменений
    const formattedField = { ...field };
    
    // Обрабатываем координаты
    try {
      if (field.coordinates) {
        // Проверяем, являются ли координаты строкой (JSON)
        if (typeof field.coordinates === 'string') {
          try {
            formattedField.coordinates = JSON.parse(field.coordinates);
          } catch (e) {
            console.error('Ошибка парсинга JSON координат:', e);
            formattedField.coordinates = [];
          }
        } 
        
        // Обеспечиваем правильную вложенность координат
        if (Array.isArray(formattedField.coordinates)) {
          // Если первый элемент не массив, оборачиваем координаты в дополнительный массив
          if (!Array.isArray(formattedField.coordinates[0])) {
            formattedField.coordinates = [formattedField.coordinates];
          }
          
          // Если первый элемент массив, но не содержит массивов внутри, значит формат [[lon, lat], ...]
          // Оборачиваем в дополнительный массив для формата [[[lon, lat], ...]]
          else if (!Array.isArray(formattedField.coordinates[0][0]) && formattedField.coordinates[0].length === 2) {
            formattedField.coordinates = [formattedField.coordinates];
          }
        }
      } else {
        formattedField.coordinates = [];
      }
    } catch (error) {
      console.error('Ошибка при обработке координат поля:', error);
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