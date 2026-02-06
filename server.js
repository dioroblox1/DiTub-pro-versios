const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const DB_FILE = './db.json';
const UPLOADS_DIR = './uploads/';

// Проверка папки для хранения файлов
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Чтение базы данных
function readDB() {
    if (!fs.existsSync(DB_FILE)) return { videos: [], users: [] };
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        return { videos: [], users: [] };
    }
}

// Запись в базу данных
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/videos', express.static('uploads'));

// Настройка загрузки файлов через Multer
const upload = multer({ storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})});

// --- АККАУНТЫ ---
app.post('/register', (req, res) => {
    const db = readDB();
    if (db.users.find(u => u.login === req.body.login)) return res.status(400).send('Логин занят');
    const newUser = { 
        login: req.body.login, 
        pass: req.body.pass, 
        avatar: `https://api.dicebear.com{req.body.login}`, 
        theme: 'blue' 
    };
    db.users.push(newUser);
    writeDB(db);
    res.json(newUser);
});

app.post('/login', (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.login === req.body.login && u.pass === req.body.pass);
    if (!user) return res.status(401).send('Неверный логин или пароль');
    res.json(user);
});

// --- ВИДЕО И SHORTS (ОСНОВНАЯ ЛОГИКА) ---
app.post('/upload-video', upload.single('video'), (req, res) => {
    const db = readDB();
    
    // Проверяем, пришел ли флаг "Shorts" из формы
    const isShorts = req.body.isShorts === 'true';

    const newEntry = {
        id: Date.now().toString(),
        title: req.body.title || 'Без названия',
        author: req.body.author || 'Аноним',
        url: req.file.filename,
        type: isShorts ? 'shorts' : 'video', // Сохраняем тип ролика
        likes: 0,
        views: 0,
        likedBy: [],
        comments: []
    };

    db.videos.push(newEntry);
    writeDB(db);
    res.redirect('/'); // Возвращаемся на главную
});

// Получение списка всех роликов с аватарами авторов
app.get('/list-videos', (req, res) => {
    const db = readDB();
    const result = db.videos.map(v => {
        const u = db.users.find(user => user.login === v.author);
        return { ...v, avatar: u ? u.avatar : '' };
    });
    res.json(result);
});

// Удаление видео
app.post('/delete-video/:id', (req, res) => {
    const db = readDB();
    const videoIndex = db.videos.findIndex(v => v.id === req.params.id);
    const video = db.videos[videoIndex];

    if (video && video.author === req.body.login) {
        const filePath = path.join(UPLOADS_DIR, video.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        db.videos.splice(videoIndex, 1);
        writeDB(db);
        res.json({ success: true });
    } else {
        res.status(403).send('Нет прав');
    }
});

// --- ВЗАИМОДЕЙСТВИЕ (ЛАЙКИ, ПРОСМОТРЫ, КОММЕНТЫ) ---

app.post('/view/:id', (req, res) => {
    const db = readDB();
    const video = db.videos.find(v => v.id === req.params.id);
    if (video) {
        video.views = (video.views || 0) + 1;
        writeDB(db);
        res.json({ success: true, views: video.views });
    } else res.status(404).send('Не найдено');
});

app.post('/like/:id', (req, res) => {
    const db = readDB();
    const video = db.videos.find(v => v.id === req.params.id);
    if (video && !video.likedBy.includes(req.body.login)) {
        video.likes++;
        video.likedBy.push(req.body.login);
        writeDB(db);
    }
    res.json(video);
});

app.post('/comment/:id', (req, res) => {
    const db = readDB();
    const video = db.videos.find(v => v.id === req.params.id);
    if (video) {
        video.comments.push({ 
            id: Date.now().toString(), 
            user: req.body.user, 
            text: req.body.text, 
            likes: 0, 
            likedBy: [],
            replies: [] 
        });
        writeDB(db);
    }
    res.redirect('/');
});

// Лайки на комментарии и ответы
app.post('/action/:vId/:cId/:type', (req, res) => {
    const db = readDB();
    const v = db.videos.find(v => v.id === req.params.vId);
    const comm = v?.comments.find(c => c.id === req.params.cId);
    const login = req.body.login;

    if (comm) {
        if (req.params.type === 'like' && !comm.likedBy.includes(login)) {
            comm.likes++;
            comm.likedBy.push(login);
        }
        if (req.params.type === 'likeReply') {
            const reply = comm.replies.find(r => r.id === req.body.rId);
            if (reply && !reply.likedBy.includes(login)) {
                reply.likes++;
                reply.likedBy.push(login);
            }
        }
        writeDB(db);
    }
    res.json({ success: true });
});

app.post('/reply/:vId/:cId', (req, res) => {
    const db = readDB();
    const v = db.videos.find(v => v.id === req.params.vId);
    const comm = v?.comments.find(c => c.id === req.params.cId);
    if (comm) {
        comm.replies.push({ 
            id: Date.now().toString(),
            user: req.body.user, 
            text: req.body.text,
            likes: 0,
            likedBy: []
        });
        writeDB(db);
    }
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Di Tub SUPREME запущен на http://localhost:${PORT}`));
