import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Разрешаем запросы с любого источника (или укажите конкретный домен)
app.use(cors({
  origin: '*', // Разрешаем запросы с любого источника
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
});

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : 'localhost';
const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : 8000;

// Логируем параметры запуска
console.log(`Starting server with host=${host}, port=${port}`);

// Указываем данные для подключения к базе данных напрямую
const db = mysql.createPool({
    host: '127.0.0.1',      // Хост базы данных
    user: 'root',           // Имя пользователя
    password: '',           // Пустой пароль
    database: 'appi',       // Имя базы данных
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
  res.send('Сервер запущен!');
});

app.get('/api/fields', async (req, res) => {
    try {
        console.log('Попытка подключения к базе данных...');
        const [fields] = await db.query('SELECT * FROM fields');
        console.log('Данные успешно получены:', fields);
        res.json(fields);
    } catch (error) {
        console.error('Ошибка при получении полей:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

app.get('/api/seasons', async (req, res) => {
  try {
    const [seasons] = await db.query('SELECT * FROM seasons');
    res.status(200).json(seasons);
  } catch (error) {
    console.error('Ошибка при получении сезонов:', error);
    res.status(500).json({ error: 'Ошибка при получении сезонов' });
  }
});

app.get('/api/seeds', async (req, res) => {
  try {
    const [seeds] = await db.query('SELECT seeds.*, seed_colors.color FROM seeds LEFT JOIN seed_colors ON seeds.id = seed_colors.seed_id');
    res.json(seeds);
  } catch (error) {
    console.error('Ошибка при получении семян:', error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

app.get('/api/seasons/:season/fields', async (req, res) => {
    try {
        const seasonId = req.params.season;
        console.log('Запрос на получение полей для сезона:', seasonId);

        // Проверяем, что seasonId передан и является числом
        if (!seasonId || isNaN(seasonId)) {
            console.error('Некорректный ID сезона:', seasonId);
            return res.status(400).json({ error: 'Некорректный ID сезона' });
        }

        // Получаем поля и их свойства для указанного сезона
        const [fields] = await db.query(
            `SELECT f.id, f.name, f.coordinates, f.area, p.seed_color, p.seed_id, s.name as seed_name
             FROM fields f
             LEFT JOIN properties p ON f.id = p.field_id
             LEFT JOIN seeds s ON p.seed_id = s.id
             WHERE p.season_id = ?`,
            [seasonId]
        );

        // Проверяем, что данные возвращены
        if (!fields || !Array.isArray(fields)) {
            console.error('Данные не найдены для сезона:', seasonId);
            return res.status(404).json({ error: 'Данные не найдены' });
        }

        console.log('Поля для сезона успешно получены:', fields);
        res.json(fields);
    } catch (error) {
        console.error('Ошибка при получении полей для сезона:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

// Добавьте обработчик для POST /api/fields
// POST /api/fields
app.post('/api/fields', async (req, res) => {
    try {
        const { name, coordinates, area, season_id } = req.body;

        // Проверка наличия обязательных данных
        if (!name || !coordinates || !area) {
            return res.status(400).json({ error: 'Отсутствуют необходимые данные' });
        }

        // Сохранение данных в базу данных
        const [result] = await db.query(
            'INSERT INTO fields (name, coordinates, area, season_id) VALUES (?, ?, ?, ?)',
            [name, JSON.stringify(coordinates), area, season_id]
        );

        // Получаем данные о добавленном поле
        const [newField] = await db.query('SELECT * FROM fields WHERE id = ?', [result.insertId]);

        if (!newField || newField.length === 0) {
            return res.status(500).json({ error: 'Не удалось получить данные о новом поле' });
        }

        // Возвращаем успешный ответ с данными о новом поле
        res.status(201).json({ success: true, field: newField[0] });
    } catch (error) {
        console.error('Ошибка при добавлении полигона:', error);
        res.status(500).json({ error: 'Ошибка при добавлении данных' });
    }
});

app.post('/api/seasons', async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await db.query('INSERT INTO seasons (name) VALUES (?)', [name]);
        res.status(201).json({ success: true, id: result.insertId, name });
    } catch (error) {
        console.error('Ошибка при создании сезона:', error);
        res.status(500).json({ success: false, error: 'Ошибка при создании сезона' });
    }
});

app.post('/api/fields/properties', async (req, res) => {
  try {
    const { field_id, season_name, seed_id, seed_color } = req.body;

    // Проверка наличия обязательных данных
    if (!field_id || !season_name || !seed_id || !seed_color) {
      return res.status(400).json({ error: 'Отсутствуют обязательные данные' });
    }

    // Получаем season_id по season_name
    const [season] = await db.query('SELECT id FROM seasons WHERE name = ?', [season_name]);
    if (!season || season.length === 0) {
      return res.status(404).json({ error: 'Сезон не найден' });
    }
    const season_id = season[0].id;

    // Сохранение свойств поля в базу данных
    const [result] = await db.query(
      'INSERT INTO properties (field_id, season_id, seed_id, seed_color) VALUES (?, ?, ?, ?)',
      [field_id, season_id, seed_id, seed_color]
    );

    console.log('Свойства поля успешно сохранены:', result);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Ошибка при сохранении свойств поля:', error);
    res.status(500).json({ error: 'Ошибка при сохранении данных', details: error.message });
  }
});

// POST /api/seeds
app.post('/api/seeds', async (req, res) => {
    try {
        const { name } = req.body;

        // Проверка наличия обязательных данных
        if (!name) {
            return res.status(400).json({ error: 'Отсутствует название культуры' });
        }

        // Сохранение культуры в таблицу seeds
        const [seedResult] = await db.query(
            'INSERT INTO seeds (name) VALUES (?)',
            [name]
        );

        res.status(201).json({ success: true, id: seedResult.insertId, name });
    } catch (error) {
        console.error('Ошибка при создании культуры:', error);
        res.status(500).json({ error: 'Ошибка при создании данных' });
    }
});

// POST /api/seed-colors
app.post('/api/seed-colors', async (req, res) => {
    try {
        const { seed_id, color } = req.body;

        // Проверка наличия обязательных данных
        if (!seed_id || !color) {
            return res.status(400).json({ error: 'Отсутствуют обязательные данные' });
        }

        // Сохранение цвета культуры в таблицу seed_colors
        const [colorResult] = await db.query(
            'INSERT INTO seed_colors (seed_id, color) VALUES (?, ?)',
            [seed_id, color]
        );

        res.status(201).json({ success: true, id: colorResult.insertId });
    } catch (error) {
        console.error('Ошибка при сохранении цвета культуры:', error);
        res.status(500).json({ error: 'Ошибка при сохранении данных' });
    }
});

app.get('/api/fields/properties', async (req, res) => {
  try {
    const { season_name } = req.query;

    // Получаем все поля
    const [fields] = await db.query('SELECT * FROM fields');

    if (!season_name) {
      // Если сезон не выбран, возвращаем все поля
      return res.status(200).json(fields);
    }

    // Получаем season_id по season_name
    const [season] = await db.query('SELECT id FROM seasons WHERE name = ?', [season_name]);
    if (!season || season.length === 0) {
      return res.status(404).json({ error: 'Сезон не найден' });
    }
    const season_id = season[0].id;

    // Получаем данные для выбранного сезона
    const [properties] = await db.query(
      `SELECT p.*, f.name as field_name, f.area as field_area, s.name as seed_name, f.coordinates
       FROM properties p
       JOIN fields f ON p.field_id = f.id
       JOIN seeds s ON p.seed_id = s.id
       WHERE p.season_id = ?`,
      [season_id]
    );

    // Объединяем данные полей и свойств
    const result = fields.map(field => {
      const property = properties.find(p => p.field_id === field.id);
      return property ? property : { ...field, seed_name: null, seed_color: null };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

process.on('uncaughtException', (err) => {
  console.error('Необработанная ошибка:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Необработанный промис:', err);
});

app.listen(port, host, () => {
  console.log(`Сервер запущен на http://${host}:${port}`);
});

