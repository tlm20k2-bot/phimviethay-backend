const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// API này sẽ là: POST /api/ai/chat
router.post('/chat', aiController.chat);

module.exports = router;