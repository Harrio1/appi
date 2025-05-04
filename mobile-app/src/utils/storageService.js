import { openDB } from 'idb';

// Имя нашей базы данных IndexedDB
const DB_NAME = 'agro-mob-db';
const DB_VERSION = 1;

// Названия хранилищ (таблиц)
const STORES = {
  FIELDS: 'fields',
  SEASONS: 'seasons',
  CROPS: 'crops',
  APP_STATE: 'app-state'
};

// Инициализация базы данных
const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Создаем хранилища, если их нет
      if (!db.objectStoreNames.contains(STORES.FIELDS)) {
        db.createObjectStore(STORES.FIELDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SEASONS)) {
        db.createObjectStore(STORES.SEASONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CROPS)) {
        db.createObjectStore(STORES.CROPS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
        db.createObjectStore(STORES.APP_STATE, { keyPath: 'id' });
      }
    }
  });
  return db;
};

// Сохранение данных в хранилище
export const saveData = async (storeName, data) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Если данные - массив, сохраняем каждый элемент
    if (Array.isArray(data)) {
      for (const item of data) {
        await store.put(item);
      }
    } else {
      await store.put(data);
    }
    
    await tx.done;
    console.log(`Данные сохранены в ${storeName}`);
    return true;
  } catch (error) {
    console.error(`Ошибка сохранения в ${storeName}:`, error);
    return false;
  }
};

// Получение всех данных из хранилища
export const getAllData = async (storeName) => {
  try {
    const db = await initDB();
    return await db.getAll(storeName);
  } catch (error) {
    console.error(`Ошибка получения данных из ${storeName}:`, error);
    return [];
  }
};

// Получение конкретного элемента по id
export const getItem = async (storeName, id) => {
  try {
    const db = await initDB();
    return await db.get(storeName, id);
  } catch (error) {
    console.error(`Ошибка получения элемента по id из ${storeName}:`, error);
    return null;
  }
};

// Удаление элемента
export const deleteItem = async (storeName, id) => {
  try {
    const db = await initDB();
    await db.delete(storeName, id);
    return true;
  } catch (error) {
    console.error(`Ошибка удаления из ${storeName}:`, error);
    return false;
  }
};

// Очистка хранилища
export const clearStore = async (storeName) => {
  try {
    const db = await initDB();
    await db.clear(storeName);
    return true;
  } catch (error) {
    console.error(`Ошибка очистки ${storeName}:`, error);
    return false;
  }
};

// Сохранить состояние сетевого подключения
export const saveNetworkState = async (isOnline) => {
  await saveData(STORES.APP_STATE, { id: 'networkState', isOnline, timestamp: Date.now() });
};

// Получить состояние сетевого подключения
export const getNetworkState = async () => {
  const state = await getItem(STORES.APP_STATE, 'networkState');
  return state ? state.isOnline : navigator.onLine;
};

// Сохранение времени последней синхронизации
export const saveLastSyncTime = async () => {
  await saveData(STORES.APP_STATE, { id: 'lastSync', timestamp: Date.now() });
};

// Получение времени последней синхронизации
export const getLastSyncTime = async () => {
  const syncInfo = await getItem(STORES.APP_STATE, 'lastSync');
  return syncInfo ? syncInfo.timestamp : null;
};

export default {
  STORES,
  saveData,
  getAllData,
  getItem,
  deleteItem,
  clearStore,
  saveNetworkState,
  getNetworkState,
  saveLastSyncTime,
  getLastSyncTime
}; 