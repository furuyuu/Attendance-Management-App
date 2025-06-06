// app/routes/face.js

const express = require('express');
const router = express.Router();

// ログインチェック用ミドルウェア
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        console.log('❌ Not logged in → redirect /login');
        return res.redirect('/login');
    }
    next();
}

// GET /face → 顔認証画面を表示
router.get('/', requireLogin, (req, res) => {
    console.log('✅ GET /face → show face.ejs');
    res.render('face', { username: req.session.name });
});

module.exports = router;
