// routes/punch.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// ⭐ 修正版 requireLogin
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
}

// POST /api/punch
router.post('/', requireLogin, async (req, res) => {
    const username = req.body.username || '';
    const punchType = req.body.punch_type || '';

    console.log('--- PUNCH DEBUG START ---');
    console.log('Input username:', username);
    console.log('Input punchType:', punchType);

    // 簡易バリデーション
    if (username === '' || !['IN', 'OUT'].includes(punchType)) {
        console.log('→ Invalid input!');
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // ユーザーID取得
        const [rows] = await pool.query(
            'SELECT user_id FROM users WHERE username = ?',
            [username]
        );

        console.log('DB rows:', rows);

        if (rows.length === 0) {
            console.log('→ User not found!');
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = rows[0].user_id;

        // 打刻登録
        await pool.query(
            `INSERT INTO punch_records (user_id, punch_time, punch_type)
             VALUES (?, NOW(), ?)`,
            [userId, punchType]
        );

        console.log('→ PUNCH SUCCESS! user_id:', userId, 'punch_type:', punchType);
        console.log('--- PUNCH DEBUG END ---');

        res.json({ success: true });
    } catch (err) {
        console.error('Punch error:', err);
        res.status(500).json({ error: 'DB insert failed' });
    }
});

module.exports = router;
