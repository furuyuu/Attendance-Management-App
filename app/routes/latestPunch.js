// app/routes/latestPunch.js

const express = require('express');
const router = express.Router();
const db = require('../lib/db'); // ← これはOK

// GET /latest-punch?username=xxx
router.get('/latest-punch', async (req, res) => {
    const username = req.query.username || '';

    console.log('✅ latest-punch called for username:', username);

    if (username === '') {
        return res.status(400).json({ success: false, error: 'Missing username parameter' });
    }

    try {
        const sql = `
            SELECT p.punch_id, u.username, p.punch_time, p.punch_type
            FROM punch_records p
            INNER JOIN users u ON p.user_id = u.user_id
            WHERE u.username = ?
            ORDER BY p.punch_time DESC
            LIMIT 1
        `;

        const [rows] = await db.query(sql, [username]);

        if (rows.length === 0) {
            console.log('✅ No punch records for user:', username);
            return res.json({ success: true, data: null });
        }

        console.log('✅ latest punch for', username, ':', rows[0]);

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error in /latest-punch:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
