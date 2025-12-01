const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// API này công khai, ai cũng gọi được
router.post('/view', movieController.increaseView);
router.get('/trending', movieController.getTrending);

module.exports = router;