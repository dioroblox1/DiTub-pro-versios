const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const DB_FILE = './db.json';
const UPLOADS_DIR = './uploads/';

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

function readDB() {
    if (!fs.existsSync(DB_FILE)) return { videos: [], users: [] };
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } 
    catch (e) { return { videos: [], users: [] }; }
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ГЛАВНЫЙ ФИКС: Сервер ищет файлы прямо в корневой папке
app.use(express.static(__dirname)); 
app.use('/videos', express.static(UPLOADS_DIR));

const upload = multer({ storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', (req, res) => {
    const db = readDB();
    if (db.users.find(u => u.login === req.body.login)) return res.status(400).send('Занято');
    const newUser = { login: req.body.login, pass: req.body.pass, avatar: `https://api.dicebear.com{req.body.login}` };
    db.users.push(newUser);
    writeDB(db);
    res.json(newUser);
});

app.post('/login', (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.login === req.body.login && u.pass === req.body.pass);
    if (!user) return res.status(401).send('Ошибка');
    res.json(user);
});

app.post('/upload-video', upload.single('video'), (req, res) => {
    const db = readDB();
    db.videos.push({
        id: Date.now().toString(),
        title: req.body.title,
        author: req.body.author,
        url: req.file.filename,
        type: req.body.isShorts === 'true' ? 'shorts' : 'video',
        likes: 0,
        views: 0,
        likedBy: [],
        comments: []
    });
    writeDB(db);
    res.redirect('/');
});

app.get('/list-videos', (req, res) => {
    const db = readDB();
    const result = db.videos.map(v => {
        const u = db.users.find(user => user.login === v.author);
        return { ...v, avatar: u ? u.avatar : '' };
    });
    res.json(result);
});

app.post('/view/:id', (req, res) => {
    const db = readDB();
    const v = db.videos.find(v => v.id === req.params.id);
    if (v) { v.views = (v.views || 0) + 1; writeDB(db); }
    res.json({ success: true });
});

app.post('/like/:id', (req, res) => {
    const db = readDB();
    const v = db.videos.find(v => v.id === req.params.id);
    if (v && !v.likedBy.includes(req.body.login)) {
        v.likes++;
        v.likedBy.push(req.body.login);
        writeDB(db);
    }
    res.json(v);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Di Tub SUPREME LIVE'));


