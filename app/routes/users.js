// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Users Page (準備中)');
});

module.exports = router;
