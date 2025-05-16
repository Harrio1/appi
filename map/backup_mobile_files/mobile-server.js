const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

// Базовые тестовые данные
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

// Важно! Конфигурация CORS с поддержкой всех источников
const corsOptions = {
  origin: ['http://192.168.1.103:3000', 'http://localhost:3000'], // Разрешаем запросы только из этих источников
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  credentials: true
};

// Применяем CORS middleware
app.use(cors(corsOptions));

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.headers.origin) {
    console.log(`  Origin: ${req.headers.origin}`);
  }
  next();
});

// Парсинг JSON
app.use(express.json());

// API endpoint для проверки работоспособности
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Мобильный API сервер работает' });
});

// API endpoint для получения полей
app.get('/api/fields', (req, res) => {
  console.log('Отправка данных полей');
  res.json(fields);
});

// API endpoint для получения сезонов
app.get('/api/seasons', (req, res) => {
  console.log('Отправка данных сезонов');
  res.json(seasons);
});

// API endpoint для получения культур
app.get('/api/seeds', (req, res) => {
  console.log('Отправка данных культур');
  res.json(seeds);
});

// API endpoint для получения полей для конкретного сезона
app.get('/api/seasons/:id/fields', (req, res) => {
  const seasonId = req.params.id;
  console.log(`Отправка данных полей для сезона ${seasonId}`);
  
  const seasonFields = [
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
  
  res.json(seasonFields);
});

// Добавляем поддержку роутов без префикса /api/
app.get('/fields', (req, res) => {
  console.log('Отправка данных полей (без префикса api)');
  res.json(fields);
});

app.get('/seasons', (req, res) => {
  console.log('Отправка данных сезонов (без префикса api)');
  res.json(seasons);
});

app.get('/seeds', (req, res) => {
  console.log('Отправка данных культур (без префикса api)');
  res.json(seeds);
});

// Запуск сервера
app.listen(PORT, '192.168.1.103', () => {
  console.log(`Мобильный API сервер запущен на порту ${PORT}`);
  console.log(`Доступен по адресу: http://192.168.1.103:${PORT}`);
  console.log(`Тестовый эндпоинт: http://192.168.1.103:${PORT}/api/health`);
});
  console.log(`Доступен по адресу: http://192.168.1.103:${PORT}`);
  console.log(`Тестовый эндпоинт: http://192.168.1.103:${PORT}/api/health`);
});
  console.log(`Доступен по адресу: http://192.168.1.103:${PORT}`);
  console.log(`Тестовый эндпоинт: http://192.168.1.103:${PORT}/api/health`);
});
  console.log(`Доступен по адресу: http://192.168.58.253:${PORT}`);
  console.log(`Тестовый эндпоинт: http://192.168.58.253:${PORT}/api/health`);
});
  console.log(`Доступен по адресу: http://192.168.1.103:${PORT}`);
  console.log(`Тестовый эндпоинт: http://192.168.1.103:${PORT}/api/health`);
});
  console.log(`Доступен по адресу: http://192.168.58.253:${PORT}`);
  console.log(`Тестовый эндпоинт: http://192.168.58.253:${PORT}/api/health`);
}); 