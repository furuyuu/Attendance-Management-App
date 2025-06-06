// app/routes/records.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // DB接続

// ログインチェック（再利用OK）
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// GET /records → 一覧表示
router.get('/', requireLogin, async (req, res) => {
    try {
        const sql = `
            SELECT p.punch_time, p.punch_type, u.full_name
            FROM punch_records p
            INNER JOIN users u ON p.user_id = u.user_id
            ORDER BY p.punch_time DESC
            LIMIT 100
        `;

        const [rows] = await pool.query(sql);

        res.render('records', { records: rows });
    } catch (err) {
        console.error('Error in GET /records:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
