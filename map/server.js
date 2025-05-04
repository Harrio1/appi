const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Импортируем подключение к базе данных
// Чтобы использовать реальную базу данных, раскомментируйте следующую строку
// const { db } = require('./src/utils/database');

const app = express();
const PORT = process.env.PORT || 3003;

// Включаем CORS для всех запросов
app.use(cors());

// Парсим JSON в теле запроса
app.use(express.json());

// Настраиваем прокси для API (изменено - API теперь обслуживается на том же порту)
app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// API endpoint для проверки работоспособности
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API сервер работает' });
});

// API endpoints для основных ресурсов
// В каждом эндпоинте есть:
// 1. Код для получения данных из базы данных (закомментирован)
// 2. Временная реализация с жестко заданными данными

// Получение списка полей
app.get('/api/fields', async (req, res) => {
  try {
    // Версия с базой данных:
    // const fields = await db('fields').select('*');
    
    // Временные данные:
    const fields = [
      {
        id: '1',
        name: 'Поле 1',
        coordinates: [
          [
            [46.55, 41.03],
            [46.56, 41.03],
            [46.56, 41.04],
            [46.55, 41.04],
            [46.55, 41.03]
          ]
        ],
        area: 25000,
        field_type: 'Пшеница',
        color: '#FFD700'
      },
      {
        id: '2',
        name: 'Поле 2',
        coordinates: [
          [
            [46.57, 41.05],
            [46.58, 41.05],
            [46.58, 41.06],
            [46.57, 41.06],
            [46.57, 41.05]
          ]
        ],
        area: 18000,
        field_type: 'Кукуруза',
        color: '#8B4513'
      }
    ];
    
    res.json(fields);
  } catch (error) {
    console.error('Ошибка при получении полей:', error);
    res.status(500).json({ error: 'Ошибка при получении данных полей' });
  }
});

// Получение списка сезонов
app.get('/api/seasons', async (req, res) => {
  try {
    // Версия с базой данных:
    // const seasons = await db('seasons').select('*');
    
    // Временные данные:
    const seasons = [
      {
        id: '1',
        name: 'Сезон 2023',
        year: 2023
      },
      {
        id: '2',
        name: 'Сезон 2022',
        year: 2022
      }
    ];
    
    res.json(seasons);
  } catch (error) {
    console.error('Ошибка при получении сезонов:', error);
    res.status(500).json({ error: 'Ошибка при получении данных сезонов' });
  }
});

// Получение списка семян/культур
app.get('/api/seeds', async (req, res) => {
  try {
    // Версия с базой данных:
    // const seeds = await db('seeds').select('*');
    
    // Временные данные:
    const seeds = [
      {
        id: '1',
        name: 'Пшеница',
        color: '#FFD700',
        description: 'Озимая пшеница'
      },
      {
        id: '2',
        name: 'Кукуруза',
        color: '#8B4513',
        description: 'Кукуруза сладкая'
      },
      {
        id: '3',
        name: 'Подсолнечник',
        color: '#FFA500',
        description: 'Подсолнечник масличный'
      },
      {
        id: '4',
        name: 'Соя',
        color: '#90EE90',
        description: 'Соя'
      }
    ];
    
    res.json(seeds);
  } catch (error) {
    console.error('Ошибка при получении культур:', error);
    res.status(500).json({ error: 'Ошибка при получении данных культур' });
  }
});

// Получение полей для конкретного сезона
app.get('/api/seasons/:id/fields', async (req, res) => {
  const seasonId = req.params.id;
  
  try {
    // Версия с базой данных:
    // const fields = await db('season_fields')
    //   .join('fields', 'season_fields.field_id', 'fields.id')
    //   .join('seeds', 'season_fields.seed_id', 'seeds.id')
    //   .where('season_fields.season_id', seasonId)
    //   .select(
    //     'fields.id',
    //     'fields.name',
    //     'seeds.name as seed_name',
    //     'seeds.color as seed_color'
    //   );
    
    // Временные данные:
    const fields = [
      {
        id: '1',
        name: 'Поле 1',
        seed_name: 'Пшеница',
        seed_color: '#FFD700'
      },
      {
        id: '2',
        name: 'Поле 2',
        seed_name: 'Кукуруза',
        seed_color: '#8B4513'
      }
    ];
    
    res.json(fields);
  } catch (error) {
    console.error(`Ошибка при получении полей для сезона ${seasonId}:`, error);
    res.status(500).json({ error: 'Ошибка при получении данных полей для сезона' });
  }
});

// Обработка 404 для API запросов
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint не найден' });
});

// Настраиваем статические файлы
app.use(express.static(path.join(__dirname, 'build')));

// Маршрут для остальных запросов - возвращаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Запускаем сервер
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://LOCALHOST:${PORT}`);
  console.log(`API доступно на http://LOCALHOST:${PORT}/api`);
  console.log(`Проверка API: http://LOCALHOST:${PORT}/api/health`);
}); 