/**
 * Подключение к базе данных
 * Использует knex для работы с базой данных
 */

// Предполагается, что вы установили зависимости:
// npm install --save mysql2 knex dotenv
const knex = require('knex');
require('dotenv').config();

// Настройки соединения с базой данных
const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'LOCALHOST',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agrokarta'
  },
  pool: { min: 0, max: 7 }
});

// Проверка соединения с базой данных
const checkConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Подключение к базе данных успешно установлено');
    return true;
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
    return false;
  }
};

// Автоматически проверяем соединение при импорте
if (process.env.NODE_ENV !== 'test') {
  checkConnection();
}

module.exports = {
  db,
  checkConnection
}; 