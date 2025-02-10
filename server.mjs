import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Разрешаем запросы с любого источника (или укажите конкретный домен)
app.use(cors());
app.use(express.json());

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '192.168.1.113';
const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : 8000;

// Указываем данные для подключения к базе данных напрямую
const db = mysql.createPool({
    host: '127.0.0.1',      // Хост базы данных
    user: 'root',           // Имя пользователя
    password: '',           // Пустой пароль
    database: 'appi'        // Имя базы данных
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
        res.json(seasons);
    } catch (error) {
        console.error('Ошибка при получении сезонов:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

app.get('/api/seeds', async (req, res) => {
    try {
        const [seeds] = await db.query('SELECT * FROM seeds');
        res.json(seeds);
    } catch (error) {
        console.error('Ошибка при получении семян:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

app.get('/api/seasons/:season/fields', async (req, res) => {
    try {
        const seasonId = req.params.season;

        // Получаем поля и их свойства для указанного сезона
        const [fields] = await db.query(
            `SELECT f.id, f.name, f.coordinates, f.area, p.field_type, p.seed_color
             FROM fields f
             JOIN properties p ON f.id = p.field_id
             WHERE p.season_id = ?`,
            [seasonId]
        );

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

        console.log('Полигон успешно добавлен в базу данных:', result);

        // Получаем данные о добавленном поле
        const [newField] = await db.query('SELECT * FROM fields WHERE id = ?', [result.insertId]);

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
        const { field_id, season_name, field_type, seed_color } = req.body;

        // Проверка наличия обязательных данных
        if (!field_id || !season_name || !field_type || !seed_color) {
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
            'INSERT INTO properties (field_id, season_id, field_type, seed_color) VALUES (?, ?, ?, ?)',
            [field_id, season_id, field_type, seed_color]
        );

        console.log('Свойства поля успешно сохранены:', result);
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Ошибка при сохранении свойств поля:', error);
        res.status(500).json({ error: 'Ошибка при сохранении данных' });
    }
});

// GET /api/field-types
app.get('/api/field-types', async (req, res) => {
    try {
        const [fieldTypes] = await db.query(`
            SELECT ft.id, ft.name, sc.color
            FROM field_types ft
            LEFT JOIN seed_colors sc ON ft.id = sc.seed_id
        `);
        res.json(fieldTypes);
    } catch (error) {
        console.error('Ошибка при получении культур:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

// POST /api/seeds
app.post('/api/seeds', async (req, res) => {
    try {
        const { name, color } = req.body;

        // Проверка наличия обязательных данных
        if (!name || !color) {
            return res.status(400).json({ error: 'Отсутствуют обязательные данные' });
        }

        // Сохранение новой культуры в таблицу seeds
        const [seedResult] = await db.query(
            'INSERT INTO seeds (name) VALUES (?)',
            [name]
        );

        // Сохранение цвета культуры в таблицу seed_colors
        const [colorResult] = await db.query(
            'INSERT INTO seeds_colors (seed_id, color) VALUES (?, ?)',
            [seedResult.insertId, color]
        );

        console.log('Культура успешно создана:', seedResult, colorResult);
        res.status(201).json({ success: true, id: seedResult.insertId, name, color });
    } catch (error) {
        console.error('Ошибка при создании культуры:', error);
        res.status(500).json({ error: 'Ошибка при создании данных' });
    }
});

// POST /api/field-types
app.post('/api/field-types', async (req, res) => {
    try {
        const { name, color } = req.body;

        // Проверка наличия обязательных данных
        if (!name || !color) {
            return res.status(400).json({ error: 'Отсутствуют обязательные данные' });
        }

        // Начинаем транзакцию
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Сохранение новой культуры в таблицу field_types
            const [fieldTypeResult] = await connection.query(
                'INSERT INTO field_types (name) VALUES (?)',
                [name]
            );

            // Использование id новой записи из field_types для вставки в seed_colors
            const [colorResult] = await connection.query(
                'INSERT INTO seed_colors (field_type_id, color) VALUES (?, ?)',
                [fieldTypeResult.insertId, color]
            );

            // Подтверждаем транзакцию
            await connection.commit();
            connection.release();

            console.log('Культура успешно создана:', fieldTypeResult, colorResult);
            res.status(201).json({ 
                success: true, 
                id: fieldTypeResult.insertId, 
                name, 
                color 
            });
        } catch (error) {
            // Откатываем транзакцию в случае ошибки
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Ошибка при создании культуры:', {
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            error: 'Ошибка при создании данных',
            details: {
                message: error.message,
                sqlMessage: error.sqlMessage
            }
        });
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

