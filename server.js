const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Настройка базы данных SQLite
const db = new sqlite3.Database('images.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
    } else {
        console.log('Подключение к базе данных установлено.');
        db.run(`CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filePath TEXT NOT NULL
        )`);
    }
});

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'data', 'news');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Middleware для обработки
app.use(express.json());

// Статическая папка для изображений
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Настройка для обслуживания статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Настройка для обслуживания папки с изображениями
app.use('/data/news', express.static(path.join(__dirname, 'data', 'news')));

// Маршрут для загрузки изображений
app.post('/upload', upload.single('image'), (req, res) => {
    console.log('--- Начало обработки запроса на загрузку ---');
    console.log('Тело запроса:', req.body);
    console.log('Файл:', req.file);

    if (!req.file) {
        console.error('Файл не загружен.');
        return res.status(400).json({ success: false, message: 'Файл не загружен' });
    }

    const filePath = `/data/news/${req.file.filename}`;
    console.log(`Файл сохранён по пути: ${filePath}`);

    db.run('INSERT INTO images (filePath) VALUES (?)', [filePath], (err) => {
        if (err) {
            console.error('Ошибка записи в базу данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка записи в базу данных' });
        }
        console.log('Файл успешно добавлен в базу данных.');
        res.json({ success: true, filePath });
    });
    console.log('--- Конец обработки запроса на загрузку ---');
});

// Маршрут для получения списка изображений
app.get('/uploads', (req, res) => {
    db.all('SELECT * FROM images', (err, rows) => {
        if (err) {
            console.error('Ошибка чтения из базы данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка чтения из базы данных' });
        }
        console.log('Список изображений из базы данных:', rows);
        res.json(rows);
    });
});

// Маршрут для удаления изображений
app.delete('/delete', (req, res) => {
    const { filePath } = req.body;
    if (!filePath) {
        return res.status(400).json({ success: false, message: 'Путь к файлу не указан' });
    }

    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        db.run('DELETE FROM images WHERE filePath = ?', [filePath], (err) => {
            if (err) {
                console.error('Ошибка удаления из базы данных:', err);
                return res.status(500).json({ success: false, message: 'Ошибка удаления из базы данных' });
            }
            res.json({ success: true, message: 'Файл удалён' });
        });
    } else {
        res.status(404).json({ success: false, message: 'Файл не найден' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});