// app/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../lib/db'); // 共通DB接続！

// ✅ GET /  → login画面表示
router.get('/', (req, res) => {
    res.render('login', {
        errorMessage: ''
    });
});

// ✅ POST /  → ログイン処理
router.post('/login', async (req, res) => {
    const loginId = req.body.login_id;
    const password = req.body.password;

    try {
        const sql = `
            SELECT * FROM login_accounts
            WHERE login_id = ?
            LIMIT 1
        `;
        const [rows] = await db.query(sql, [loginId]);

        if (rows.length === 0) {
            return res.render('login', {
                errorMessage: 'ログインID、又はパスワードに誤りがあります。'
            });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.render('login', {
                errorMessage: 'ログインID、又はパスワードに誤りがあります。'
            });
        }

        // ✅ セッション保存
        req.session.userId = user.user_id;
        req.session.loginId = user.login_id;
        req.session.name = user.name;

        console.log('✅ LOGIN SUCCESS:', user.login_id);

        res.redirect('/face');

    } catch (err) {
        console.error('Error in POST /login:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ GET /logout → ログアウト処理
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error in logout:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
