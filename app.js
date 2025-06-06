// app.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// ✅ DB設定
const dbOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

// ✅ セッションストア
const sessionStore = new MySQLStore(dbOptions);

// ✅ ミドルウェア
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ セッション設定
app.use(session({
    key: 'attendance_sid',
    secret: 'secret_attendance_system', // 本番は環境変数化
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 3 // 3時間
    }
}));

// ✅ 静的ファイル (public = 旧 htdocs 相当)
app.use(express.static(path.join(__dirname, 'app/public')));

// ✅ EJSテンプレート設定 (旧 template/ 相当)
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

// ✅ デバッグ開始
console.log('✅ app.js start point');

// ✅ ルーティング読み込み（順番重要！）
const authRoutes = require('./app/routes/auth');
const punchRoutes = require('./app/routes/punch');
const usersRoutes = require('./app/routes/users');
const faceRoutes = require('./app/routes/face');
const latestPunchRoutes = require('./app/routes/latestPunch');
const recordsRoutes = require('./app/routes/records'); // ← ⭐ NEW

console.log('✅ after require all routes');

// ✅ ルート定義順

// 認証関連
app.use('/', authRoutes);

// API関連
app.use('/api/punch', punchRoutes);
app.use('/api', latestPunchRoutes);

// ユーザー管理
app.use('/users', usersRoutes);

// 顔認証画面
app.use('/face', faceRoutes);

// 出退勤履歴（一覧画面）
app.use('/records', recordsRoutes);

console.log('✅ after all app.use');

// ✅ ヘルスチェック
app.get('/health', (req, res) => {
    res.send('<h1>healthy</h1>');
});

// ✅ サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}`);
});
