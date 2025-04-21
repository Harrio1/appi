# Агро-карта

## Настройка и запуск проекта

### Настройка окружения

1. Убедитесь, что у вас установлен Node.js версии 14.x или выше
2. Установите зависимости проекта:
   ```
   npm install
   ```

### Подключение к базе данных

Проект настроен для работы с базой данных. Чтобы настроить подключение:

1. Установите необходимые зависимости:
   ```
   npm install --save mysql2 knex dotenv
   ```

2. Создайте файл `.env` в корне проекта с настройками БД:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=agrokarta
   ```

3. Создайте файл для подключения к БД в `map/src/utils/database.js`:
   ```javascript
   const knex = require('knex');
   require('dotenv').config();

   const db = knex({
     client: 'mysql2',
     connection: {
       host: process.env.DB_HOST,
       port: process.env.DB_PORT,
       user: process.env.DB_USER,
       password: process.env.DB_PASSWORD,
       database: process.env.DB_NAME
     },
     pool: { min: 0, max: 7 }
   });

   module.exports = db;
   ```

4. Обновите обработчики API в `server.js`, чтобы использовать БД:
   ```javascript
   const db = require('./src/utils/database');
   
   app.get('/api/fields', async (req, res) => {
     try {
       const fields = await db('fields').select('*');
       res.json(fields);
     } catch (error) {
       console.error('Ошибка при получении полей:', error);
       res.status(500).json({ error: 'Ошибка при получении данных' });
     }
   });
   ```

## Запуск проекта

### Шаг 1: Запуск API-сервера

Для запуска API-сервера используйте:

**Windows:**
```
start-server.bat
```

**Linux/Mac:**
```
chmod +x start-server.sh
./start-server.sh
```

Сервер запустится на порту 3003 и будет доступен по адресу: http://localhost:3003/api

### Шаг 2: Запуск клиентского приложения

После запуска сервера, откройте новое окно терминала и запустите клиентское приложение:

```
npm start
```

Приложение будет доступно по адресу: http://localhost:3003

### Возможные проблемы и их решение

#### Ошибка ERR_CONNECTION_REFUSED

Если вы видите ошибку `ERR_CONNECTION_REFUSED`, убедитесь, что:

1. API-сервер запущен и работает на порту 3003
2. У вас нет других процессов, занимающих порт 3003

Для проверки запущенного сервера откройте в браузере: http://localhost:3003/api/health

## Структура проекта

- `/src` - исходный код приложения
  - `/components` - React компоненты
  - `/utils` - вспомогательные функции
  - `/config` - конфигурация приложения
  - `/css` - стили
- `/public` - статические файлы
- `/build` - скомпилированное приложение (после `npm run build`)

## Устранение неполадок

### Ошибки подключения к API (ERR_CONNECTION_REFUSED)

Если вы видите ошибки подключения к API:

1. Убедитесь, что сервер запущен на порту 3003
2. Проверьте файл `server.js` для корректных настроек API
3. Убедитесь, что в файле `.env.local` указан правильный порт API (REACT_APP_API_PORT=3003)
4. Проверьте подключение к базе данных в файле `.env`

### Ошибка Service Worker

Если вы видите ошибку "InvalidStateError: Only the active worker can claim clients":

1. Откройте файл `src/index.js` и убедитесь, что Service Worker отключен: `serviceWorker.unregister()`
2. Или исправьте файл `public/service-worker.js`, удалив вызовы `clients.claim()` и `skipWaiting()`

## Режим офлайн-работы

Приложение поддерживает офлайн-режим с использованием данных-заглушек. Для включения офлайн-режима используйте:

```javascript
import { toggleOfflineMode } from './utils/apiConfig';

// Включить офлайн-режим
toggleOfflineMode(true);

// Выключить офлайн-режим
toggleOfflineMode(false);
```